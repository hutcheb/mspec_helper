package com.yourorg.mspec

import com.intellij.lang.Language

/**
 * Language definition for MSpec
 */
class MSpecLanguage : Language("MSpec") {
    
    companion object {
        @JvmStatic
        val INSTANCE = MSpecLanguage()
    }

    override fun getDisplayName(): String = "MSpec"

    override fun isCaseSensitive(): Boolean = true
}
