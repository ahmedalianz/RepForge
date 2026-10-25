package com.repforge.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.modules.i18nmanager.I18nUtil

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      useDevSupport = BuildConfig.DEBUG,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    val localizationBootstrap = getSharedPreferences("repforge.localization", MODE_PRIVATE)
    if (!localizationBootstrap.getBoolean("initialized", false)) {
      // Seed before React reads layout direction; subsequent launches keep the user's choice.
      I18nUtil.instance.apply {
        allowRTL(this@MainApplication, true)
        forceRTL(this@MainApplication, true)
        swapLeftAndRightInRTL(this@MainApplication, true)
      }
      localizationBootstrap.edit().putBoolean("initialized", true).apply()
    }
    loadReactNative(this)
  }
}
