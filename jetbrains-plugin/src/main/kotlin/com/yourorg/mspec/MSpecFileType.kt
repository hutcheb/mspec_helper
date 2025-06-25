package com.yourorg.mspec

import com.intellij.openapi.fileTypes.LanguageFileType
import com.intellij.openapi.util.IconLoader
import javax.swing.Icon

/**
 * File type definition for MSpec files
 */
class MSpecFileType : LanguageFileType(MSpecLanguage.INSTANCE) {
    
    companion object {
        @JvmStatic
        val INSTANCE = MSpecFileType()
    }

    override fun getName(): String = "MSpec File"

    override fun getDescription(): String = "PLC4X MSpec protocol definition file"

    override fun getDefaultExtension(): String = "mspec"

    override fun getIcon(): Icon? = IconLoader.getIcon("/icons/mspec.svg", MSpecFileType::class.java)
}
