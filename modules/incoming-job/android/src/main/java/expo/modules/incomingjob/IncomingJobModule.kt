package expo.modules.incomingjob

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * A new-job alert that behaves like an incoming call: it takes over the screen
 * (even on the lock screen), loops the assignment ringtone until the rider
 * answers, and opens straight into the job. Gives up after a minute.
 */
class IncomingJobModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("IncomingJob")

    Function("show") { shipmentId: String, title: String, body: String, url: String ->
      show(shipmentId, title, body, url)
    }

    Function("cancel") { shipmentId: String ->
      NotificationManagerCompat.from(context).cancel(TAG, shipmentId.hashCode())
      setShowOverLockScreen(false)
    }

    /** Called by the job screen when it opened from the alert, so it shows over the lock screen. */
    Function("showOverLockScreen") { show: Boolean ->
      setShowOverLockScreen(show)
    }

    /** Android 14+ only lets calling and alarm apps take over the screen unless the user allows it. */
    Function("canUseFullScreenIntent") {
      if (Build.VERSION.SDK_INT >= 34) {
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).canUseFullScreenIntent()
      } else {
        true
      }
    }

    Function("openFullScreenSettings") {
      val intent = if (Build.VERSION.SDK_INT >= 34) {
        Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${context.packageName}"))
      } else {
        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
      }
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }

  private fun show(shipmentId: String, title: String, body: String, url: String) {
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    // The server rings again after 30 s; don't restart one that's still going.
    if (manager.activeNotifications.any { it.tag == TAG && it.id == shipmentId.hashCode() }) return
    ensureChannel()

    val open = Intent(Intent.ACTION_VIEW, Uri.parse(url))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    val pending = PendingIntent.getActivity(
      context,
      shipmentId.hashCode(),
      open,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(smallIcon())
      .setColor(BRAND_BLUE)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setFullScreenIntent(pending, true)
      .setContentIntent(pending)
      .addAction(0, "View job", pending)
      .setOngoing(true)
      .setAutoCancel(true)
      .setTimeoutAfter(RING_FOR_MS)
      .build()
    // Keep ringing until the rider answers (or the timeout above clears it).
    notification.flags = notification.flags or android.app.Notification.FLAG_INSISTENT

    try {
      NotificationManagerCompat.from(context).notify(TAG, shipmentId.hashCode(), notification)
    } catch (_: SecurityException) {
      // Notifications are switched off for the app; the server's push and the
      // in-app alert are the fallback.
    }
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return

    val sound = Uri.parse("${ContentResolver.SCHEME_ANDROID_RESOURCE}://${context.packageName}/raw/$SOUND_NAME")
    val audio = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()
    val channel = NotificationChannel(CHANNEL_ID, "Incoming jobs", NotificationManager.IMPORTANCE_HIGH).apply {
      description = "Rings like a call when dispatch assigns you a delivery."
      setSound(sound, audio)
      enableVibration(true)
      vibrationPattern = longArrayOf(0, 700, 300, 700, 1200)
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      setBypassDnd(true)
    }
    manager.createNotificationChannel(channel)
  }

  private fun setShowOverLockScreen(show: Boolean) {
    val activity = appContext.currentActivity ?: return
    activity.runOnUiThread {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        activity.setShowWhenLocked(show)
        activity.setTurnScreenOn(show)
      }
    }
  }

  /** expo-notifications' monochrome icon when configured, else the launcher icon. */
  private fun smallIcon(): Int {
    val id = context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
    return if (id != 0) id else context.applicationInfo.icon
  }

  companion object {
    private const val TAG = "incoming-job"
    private const val CHANNEL_ID = "incoming_jobs"
    /** Copied to res/raw by the expo-notifications plugin from assets/sounds/assignment.wav. */
    private const val SOUND_NAME = "assignment"
    private const val RING_FOR_MS = 60_000L
    private const val BRAND_BLUE = 0xFF208AEF.toInt()
  }
}
