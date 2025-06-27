plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "2.0.0"
    id("org.jetbrains.intellij.platform") version "2.6.0"
}

group = providers.gradleProperty("pluginGroup").get()
version = providers.gradleProperty("pluginVersion").get()

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        val platformType = providers.gradleProperty("platformType")
        val platformVersion = providers.gradleProperty("platformVersion")
        create(platformType, platformVersion)

        // Plugin dependencies
        bundledPlugin("com.intellij.java")
        bundledPlugin("org.jetbrains.kotlin")

        // Plugin verifier for compatibility testing
        pluginVerifier()

        // ZIP Signer for plugin signing
        zipSigner()
    }

    // LSP dependencies for language server integration
    implementation("org.eclipse.lsp4j:org.eclipse.lsp4j:0.21.0")
    // Note: Coroutines are provided by IntelliJ Platform, so we don't need to add them explicitly
}

tasks {
    // Set the JVM compatibility versions
    withType<JavaCompile> {
        sourceCompatibility = "21"
        targetCompatibility = "21"
    }
    withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
        compilerOptions {
            jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21)
        }
    }

    patchPluginXml {
        sinceBuild.set(providers.gradleProperty("pluginSinceBuild"))
        untilBuild.set(providers.gradleProperty("pluginUntilBuild"))
    }

    signPlugin {
        certificateChain.set(System.getenv("CERTIFICATE_CHAIN"))
        privateKey.set(System.getenv("PRIVATE_KEY"))
        password.set(System.getenv("PRIVATE_KEY_PASSWORD"))
    }

    publishPlugin {
        token.set(System.getenv("PUBLISH_TOKEN"))
        // Specify channels for different release types
        channels.set(listOf(
            if (version.toString().contains("alpha")) "alpha"
            else if (version.toString().contains("beta")) "beta"
            else "default"
        ))
    }

    // Disable building searchable options for faster builds during development
    buildSearchableOptions {
        enabled = false
    }

    // Configure plugin verification
    verifyPlugin {
        // Use default verification settings
    }
}
