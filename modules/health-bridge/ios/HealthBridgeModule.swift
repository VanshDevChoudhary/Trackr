import ExpoModulesCore
import HealthKit

public class HealthBridgeModule: Module {
    private lazy var store = HKHealthStore()
    private var stepObserverQuery: HKObserverQuery?

    public func definition() -> ModuleDefinition {
        Name("HealthBridge")

        Events("onStepUpdate")

        AsyncFunction("requestPermissions") { (promise: Promise) in
            guard HKHealthStore.isHealthDataAvailable() else {
                promise.resolve(false)
                return
            }

            let readTypes: Set<HKSampleType> = [
                HKQuantityType(.stepCount),
                HKQuantityType(.heartRate),
                HKQuantityType(.activeEnergyBurned),
                HKObjectType.workoutType()
            ]

            self.store.requestAuthorization(toShare: nil, read: readTypes) { success, error in
                if let error = error {
                    promise.reject("HEALTHKIT_AUTH", error.localizedDescription)
                } else {
                    promise.resolve(success)
                }
            }
        }

        AsyncFunction("getSteps") { (timestamp: Double, promise: Promise) in
            let date = Date(timeIntervalSince1970: timestamp / 1000)
            let start = Calendar.current.startOfDay(for: date)
            guard let end = Calendar.current.date(byAdding: .day, value: 1, to: start) else {
                promise.resolve(0)
                return
            }

            let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
            let query = HKStatisticsQuery(
                quantityType: HKQuantityType(.stepCount),
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, result, error in
                if let error = error {
                    promise.reject("STEPS_QUERY", error.localizedDescription)
                    return
                }
                let steps = result?.sumQuantity()?.doubleValue(for: .count()) ?? 0
                promise.resolve(Int(steps))
            }
            store.execute(query)
        }

        AsyncFunction("getCalories") { (timestamp: Double, promise: Promise) in
            let date = Date(timeIntervalSince1970: timestamp / 1000)
            let start = Calendar.current.startOfDay(for: date)
            guard let end = Calendar.current.date(byAdding: .day, value: 1, to: start) else {
                promise.resolve(0)
                return
            }

            let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
            let query = HKStatisticsQuery(
                quantityType: HKQuantityType(.activeEnergyBurned),
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, result, error in
                if let error = error {
                    promise.reject("CALORIES_QUERY", error.localizedDescription)
                    return
                }
                let kcal = result?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
                promise.resolve(Int(kcal))
            }
            store.execute(query)
        }

        AsyncFunction("getHeartRate") { (startTs: Double, endTs: Double, promise: Promise) in
            let start = Date(timeIntervalSince1970: startTs / 1000)
            let end = Date(timeIntervalSince1970: endTs / 1000)

            let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
            let sortDesc = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

            let query = HKSampleQuery(
                sampleType: HKQuantityType(.heartRate),
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sortDesc]
            ) { _, samples, error in
                if let error = error {
                    promise.reject("HR_QUERY", error.localizedDescription)
                    return
                }
                let readings = (samples as? [HKQuantitySample])?.map { sample -> [String: Any] in
                    return [
                        "timestamp": sample.startDate.timeIntervalSince1970 * 1000,
                        "bpm": Int(sample.quantity.doubleValue(for: HKUnit(from: "count/min")))
                    ]
                } ?? []
                promise.resolve(readings)
            }
            store.execute(query)
        }

        AsyncFunction("getWorkouts") { (startTs: Double, endTs: Double, promise: Promise) in
            let start = Date(timeIntervalSince1970: startTs / 1000)
            let end = Date(timeIntervalSince1970: endTs / 1000)

            let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
            let sortDesc = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

            let query = HKSampleQuery(
                sampleType: HKObjectType.workoutType(),
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sortDesc]
            ) { _, samples, error in
                if let error = error {
                    promise.reject("WORKOUT_QUERY", error.localizedDescription)
                    return
                }
                let workouts = (samples as? [HKWorkout])?.map { w -> [String: Any] in
                    return [
                        "id": w.uuid.uuidString,
                        "type": self.workoutTypeName(w.workoutActivityType),
                        "duration": Int(w.duration),
                        "calories": Int(w.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0),
                        "startDate": w.startDate.timeIntervalSince1970 * 1000,
                        "endDate": w.endDate.timeIntervalSince1970 * 1000,
                    ]
                } ?? []
                promise.resolve(workouts)
            }
            store.execute(query)
        }

        Function("startStepObserver") {
            guard self.stepObserverQuery == nil else { return }

            let stepType = HKQuantityType(.stepCount)
            let query = HKObserverQuery(sampleType: stepType, predicate: nil) { [weak self] _, completionHandler, error in
                guard error == nil, let self = self else {
                    completionHandler()
                    return
                }
                self.fetchTodaySteps { steps in
                    self.sendEvent("onStepUpdate", ["steps": steps])
                    completionHandler()
                }
            }
            self.stepObserverQuery = query
            store.execute(query)
        }

        Function("stopStepObserver") {
            if let query = self.stepObserverQuery {
                store.stop(query)
                self.stepObserverQuery = nil
            }
        }
    }

    private func fetchTodaySteps(completion: @escaping (Int) -> Void) {
        let start = Calendar.current.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
        let query = HKStatisticsQuery(
            quantityType: HKQuantityType(.stepCount),
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, result, _ in
            let steps = result?.sumQuantity()?.doubleValue(for: .count()) ?? 0
            completion(Int(steps))
        }
        store.execute(query)
    }

    private func workoutTypeName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running: return "running"
        case .cycling: return "cycling"
        case .swimming: return "swimming"
        case .walking: return "walking"
        case .hiking: return "hiking"
        case .yoga: return "yoga"
        case .traditionalStrengthTraining, .functionalStrengthTraining: return "strength"
        case .highIntensityIntervalTraining: return "hiit"
        default: return "other"
        }
    }
}
