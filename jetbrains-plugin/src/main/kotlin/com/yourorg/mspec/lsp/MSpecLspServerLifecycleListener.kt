package com.yourorg.mspec.lsp

import com.intellij.openapi.project.Project
import com.intellij.openapi.project.ProjectManagerListener

/**
 * Lifecycle listener for MSpec LSP server management
 */
class MSpecLspServerLifecycleListener : ProjectManagerListener {

    override fun projectOpened(project: Project) {
        // Initialize LSP server when project opens
        // The actual server startup is handled by MSpecLspServerSupportProvider
        // when MSpec files are opened
    }

    override fun projectClosed(project: Project) {
        // Cleanup LSP server resources when project closes
        // The LSP framework handles this automatically
    }
}
