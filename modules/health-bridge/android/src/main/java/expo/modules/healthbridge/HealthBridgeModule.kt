package expo.modules.healthbridge

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.ZoneId
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import android.os.Handler
import android.os.Looper

class HealthBridgeModule : Module() {
    private var client: HealthConnectClient? = null
    private val scope = CoroutineScope(Dispatchers.IO)
    private var pollHandler: Handler? = null
    private var pollRunnable: Runnable? = null

    private val requiredPermissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class)
    )

    override fun definition() = ModuleDefinition {
        Name("HealthBridge")

        Events("onStepUpdate")

        OnCreate {
            try {
                val ctx = appContext.reactContext ?: return@OnCreate
                val status = HealthConnectClient.getSdkStatus(ctx)
                if (status == HealthConnectClient.SDK_AVAILABLE) {
                    client = HealthConnectClient.getOrCreate(ctx)
                }
            } catch (_: Exception) {}
        }

        AsyncFunction("requestPermissions") { promise: Promise ->
            val hc = client
            if (hc == null) {
                promise.resolve(false)
                return@AsyncFunction
            }
            scope.launch {
                try {
                    val granted = hc.permissionController.getGrantedPermissions()
                    promise.resolve(granted.containsAll(requiredPermissions))
                } catch (e: Exception) {
                    promise.reject(CodedException("HC_PERM", e.message ?: "permission check failed", e))
                }
            }
        }

        AsyncFunction("getSteps") { timestamp: Double, promise: Promise ->
            val hc = client
            if (hc == null) { promise.resolve(0); return@AsyncFunction }

            scope.launch {
                try {
                    val instant = Instant.ofEpochMilli(timestamp.toLong())
                    val zone = ZoneId.systemDefault()
                    val date = instant.atZone(zone).toLocalDate()
                    val dayStart = date.atStartOfDay(zone).toInstant()
                    val dayEnd = date.plusDays(1).atStartOfDay(zone).toInstant()

                    val response = hc.readRecords(
                        ReadRecordsRequest(
                            StepsRecord::class,
                            timeRangeFilter = TimeRangeFilter.between(dayStart, dayEnd)
                        )
                    )
                    val total = response.records.sumOf { it.count }
                    promise.resolve(total.toInt())
                } catch (e: Exception) {
                    promise.reject(CodedException("STEPS_ERR", e.message ?: "failed", e))
                }
            }
        }

        AsyncFunction("getCalories") { timestamp: Double, promise: Promise ->
            val hc = client
            if (hc == null) { promise.resolve(0); return@AsyncFunction }

            scope.launch {
                try {
                    val instant = Instant.ofEpochMilli(timestamp.toLong())
                    val zone = ZoneId.systemDefault()
                    val date = instant.atZone(zone).toLocalDate()
                    val dayStart = date.atStartOfDay(zone).toInstant()
                    val dayEnd = date.plusDays(1).atStartOfDay(zone).toInstant()

                    val response = hc.readRecords(
                        ReadRecordsRequest(
                            ActiveCaloriesBurnedRecord::class,
                            timeRangeFilter = TimeRangeFilter.between(dayStart, dayEnd)
                        )
                    )
                    val total = response.records.sumOf { it.energy.inKilocalories }
                    promise.resolve(total.toInt())
                } catch (e: Exception) {
                    promise.reject(CodedException("CAL_ERR", e.message ?: "failed", e))
                }
            }
        }

        AsyncFunction("getHeartRate") { startTs: Double, endTs: Double, promise: Promise ->
            val hc = client
            if (hc == null) { promise.resolve(emptyList<Map<String, Any>>()); return@AsyncFunction }

            scope.launch {
                try {
                    val start = Instant.ofEpochMilli(startTs.toLong())
                    val end = Instant.ofEpochMilli(endTs.toLong())

                    val response = hc.readRecords(
                        ReadRecordsRequest(
                            HeartRateRecord::class,
                            timeRangeFilter = TimeRangeFilter.between(start, end)
                        )
                    )
                    val readings = response.records.flatMap { record ->
                        record.samples.map { sample ->
                            mapOf(
                                "timestamp" to sample.time.toEpochMilli(),
                                "bpm" to sample.beatsPerMinute.toInt()
                            )
                        }
                    }
                    promise.resolve(readings)
                } catch (e: Exception) {
                    promise.reject(CodedException("HR_ERR", e.message ?: "failed", e))
                }
            }
        }

        AsyncFunction("getWorkouts") { startTs: Double, endTs: Double, promise: Promise ->
            val hc = client
            if (hc == null) { promise.resolve(emptyList<Map<String, Any>>()); return@AsyncFunction }

            scope.launch {
                try {
                    val start = Instant.ofEpochMilli(startTs.toLong())
                    val end = Instant.ofEpochMilli(endTs.toLong())

                    val response = hc.readRecords(
                        ReadRecordsRequest(
                            ExerciseSessionRecord::class,
                            timeRangeFilter = TimeRangeFilter.between(start, end)
                        )
                    )
                    val workouts = response.records.map { session ->
                        val duration = java.time.Duration.between(session.startTime, session.endTime)
                        mapOf(
                            "id" to (session.metadata.id ?: session.startTime.toString()),
                            "type" to mapExerciseType(session.exerciseType),
                            "duration" to duration.seconds.toInt(),
                            "calories" to 0, // TODO: aggregate from separate calorie records if needed
                            "startDate" to session.startTime.toEpochMilli(),
                            "endDate" to session.endTime.toEpochMilli()
                        )
                    }
                    promise.resolve(workouts)
                } catch (e: Exception) {
                    promise.reject(CodedException("WORKOUT_ERR", e.message ?: "failed", e))
                }
            }
        }
    }

    private fun mapExerciseType(type: Int): String = when (type) {
        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING -> "running"
        ExerciseSessionRecord.EXERCISE_TYPE_BIKING -> "cycling"
        ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL, ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_OPEN_WATER -> "swimming"
        ExerciseSessionRecord.EXERCISE_TYPE_WALKING -> "walking"
        ExerciseSessionRecord.EXERCISE_TYPE_HIKING -> "hiking"
        ExerciseSessionRecord.EXERCISE_TYPE_YOGA -> "yoga"
        ExerciseSessionRecord.EXERCISE_TYPE_WEIGHTLIFTING -> "strength"
        ExerciseSessionRecord.EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING -> "hiit"
        else -> "other"
    }
}
