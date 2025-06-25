package com.yourorg.mspec.lsp

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.platform.lsp.api.LspServerSupportProvider
import com.intellij.platform.lsp.api.ProjectWideLspServerDescriptor
import com.yourorg.mspec.MSpecFileType

/**
 * LSP Server Support Provider for MSpec language
 */
class MSpecLspServerSupportProvider : LspServerSupportProvider {

    override fun fileOpened(project: Project, file: VirtualFile, serverStarter: LspServerSupportProvider.LspServerStarter) {
        if (file.fileType == MSpecFileType.INSTANCE) {
            serverStarter.ensureServerStarted(MSpecLspServerDescriptor(project))
        }
    }
}

/**
 * LSP Server Descriptor for MSpec
 */
class MSpecLspServerDescriptor(project: Project) : ProjectWideLspServerDescriptor(project, "MSpec") {

    override fun isSupportedFile(file: VirtualFile): Boolean {
        return file.fileType == MSpecFileType.INSTANCE
    }

    override fun createCommandLine(): GeneralCommandLine {
        // Path to the MSpec language server executable
        // This should be configurable in the plugin settings
        val serverPath = findMSpecLanguageServer()
        
        return GeneralCommandLine().apply {
            exePath = serverPath
            addParameter("--stdio")
            withWorkDirectory(project.basePath)
        }
    }

    private fun findMSpecLanguageServer(): String {
        // Try to find the language server in various locations
        val possiblePaths = listOf(
            // From npm global installation
            "mspec-language-server",
            // From local node_modules
            "./node_modules/.bin/mspec-language-server",
            // From plugin bundle
            "${System.getProperty("user.home")}/.mspec/language-server/mspec-language-server"
        )

        for (path in possiblePaths) {
            if (java.io.File(path).exists()) {
                return path
            }
        }

        // Fallback to node with server.js
        return "node"
    }

    override fun createInitializationOptions(): Any? {
        return mapOf(
            "settings" to mapOf(
                "mspec" to mapOf(
                    "validation" to mapOf(
                        "enabled" to true,
                        "strictMode" to false
                    ),
                    "completion" to mapOf(
                        "enabled" to true,
                        "snippets" to true
                    ),
                    "formatting" to mapOf(
                        "enabled" to true,
                        "indentSize" to 4
                    )
                )
            )
        )
    }
}
