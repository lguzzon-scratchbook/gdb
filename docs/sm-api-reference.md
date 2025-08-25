> SM (Security Manager) Provides Role-Based Access Control (RBAC), identity management (WebAuthn, Mnemonic), and security features for GDB instances. This system enables fine-grained permission control over data operations in a distributed P2P environment.

## 📥 How to Use

The Security Manager (SM) is not imported separately but is activated and attached to your GDB instance during its creation.

### Enable the Security Manager

> To utilize the SM RBAC and identity features, you must enable the `sm` option with a configuration object when you initialize GDB.
>
> **It is mandatory to provide a `superAdmins` array** containing at least one superadmin Ethereum address. This is critical to ensure the permission system is functional from the outset, allowing roles to be assigned.
>
> ```javascript
> // Import the module
> import { gdb } from "genosdb";
>
> // Enable the security module by providing the required configuration
> const db = await gdb("my-db", {
>   rtc: true, // Required for the SM module
>   sm: {
>     superAdmins: ["0xAddressOfFirstAdmin...", "0xAnotherAdmin..."] // Mandatory list of superadmin Ethereum addresses.
>   }
> });
>
> // The 'db' instance now has the SM module configured and active.
> // You can access all security functions via `db.sm`.
> console.log(`Security Manager active. Superadmin address: ${db.sm.getActiveEthAddress() || 'None (awaiting login)'}`);
> ```
>
> **Note on Automatic Initialization**: When you provide the `sm` configuration object, the `gdb` function automatically handles all necessary internal setup. This includes registering the P2P security middleware, a core feature that relies on the `Real-Time Communication module` to sign and verify data between peers. For this reason, `rtc: true` must be enabled alongside the sm configuration. The initialization process also attempts a silent WebAuthn session resume, ensuring the db instance you receive is fully prepared for use.

---

## 📖 Overview & Core Concepts

The Security Manager (SM) for GDB integrates several key security aspects:

1.  **Identity Management**: Users are identified by Ethereum addresses. The system supports:
    - **WebAuthn**: Secure, passwordless authentication using biometrics or hardware keys to protect/unseal a user's Ethereum private key.
    - **Mnemonic Phrases**: Traditional BIP39 phrases for account creation and recovery.
2.  **Role-Based Access Control (RBAC)**:
    - A configurable hierarchy of roles with default roles: `guest`, `user`, `manager`, `admin`, `superadmin`
    - Default permissions:
      - `guest`: `['read', 'sync']`
      - `user`: `['write', 'link', 'sync']` + inherits guest
      - `manager`: `['publish']` + inherits user
      - `admin`: `['delete']` + inherits manager
      - `superadmin`: `['assignRole', 'deleteAny']` + inherits admin
    - Role assignments are stored within GDB itself, making them part of the synchronized state.
    - Custom roles can be defined by passing them in the initial configuration
3.  **P2P Operation Security**:
    - Outgoing database operations are cryptographically signed by the active user.
    - Incoming operations from peers are verified for signature validity and sender permissions before being applied.
4.  **Local Data Encryption**: Authenticated users can encrypt/decrypt data for their own use, tied to their identity.

The **`SoftwareWalletManager`** (an internal component) handles identity material (private keys, mnemonics) and WebAuthn interactions. The **`SoftwareSecurityManager`** (configured on the GDB instance by the SM) enforces P2P security by signing/verifying operations and checking RBAC permissions.

---

## 🚀 Core Setup & Lifecycle

The security module is automatically initialized when you create a GDB instance with the `sm` option. No additional setup calls are required.

#### Example

```javascript
async function initializeApp() {
  // Initialize GDB with the Security Manager enabled and superadmins
  const db = await gdb("my-db", {
    rtc: true, // Required for the SM module
    sm: {
      superAdmins: ["0x1...", "0x2..."], // Mandatory list of superadmin Ethereum addresses.
    },
  })

  console.log("Security Context Automatically Initialized for GDB.")
  // UI can now be updated based on db.sm.isSecurityActive(), db.sm.getActiveEthAddress(), etc.
}

initializeApp()
```

---

### Silent WebAuthn Resume (no prompt on refresh)

When the Security Manager initializes, it will attempt to silently resume a WebAuthn-backed session if all of the following are true:

- A previous session was completed using WebAuthn on this browser/origin (tracked internally via a localStorage flag).
- WebAuthn registration details exist for this origin (`db.sm.hasExistingWebAuthnRegistration()` returns `true`).

If both conditions are met, the SM decrypts the locally stored Ethereum key material and reactivates the signer without invoking any WebAuthn prompt. This prevents repeated biometric prompts on page reload.

Guidance for apps:

- Do not auto-call `db.sm.loginCurrentUserWithWebAuthn()` on page load; reserve it for explicit user actions (e.g., clicking “Login with WebAuthn”).
- Use `db.sm.hasExistingWebAuthnRegistration()` only to decide whether to show the WebAuthn Login button.
- Call `db.sm.clearSecurity()` to log out and clear the “last session was WebAuthn” flag; subsequent loads will not resume silently until the user logs in again with WebAuthn.

Minimal pattern:

```javascript
// Initialize GDB with SM enabled (SM will handle silent resume automatically)
const db = await gdb("my-db", {
  rtc: true, // Required for the SM module
  sm: {
    superAdmins: ["0x1...", "0x2..."], // Mandatory list of superadmin Ethereum addresses.
  },
})

// Optional: react to state changes for UI
db.sm.setSecurityStateChangeCallback((state) => updateUI(state))

// Show WebAuthn login button only if hardware is registered
const showWebAuthn = db.sm.hasExistingWebAuthnRegistration()
toggleWebAuthnLoginButton(showWebAuthn)

// On user click: perform interactive login (may prompt)
loginWebAuthnBtn.onclick = async () => {
  await db.sm.loginCurrentUserWithWebAuthn()
}
```

Note: The security context is set up automatically when you provide the `sm: { superAdmins: [...] }` configuration. The `superAdmins` field is mandatory; the SM module will not initialize without it.

---

### `db.sm.clearSecurity()`

Logs out the current user. This deactivates local signing capability by removing the active `signer` from GDB's `SoftwareSecurityManager`. It also clears any volatile identity information (like a just-generated mnemonic) and removes WebAuthn session flags from local storage. GDB's `SoftwareSecurityManager` will revert to (or remain in) a verifier-only mode for incoming P2P operations.

- **Returns**: `{Promise<void>}`

#### Example

```javascript
await db.sm.clearSecurity()
console.log("User logged out, local signing capabilities deactivated.")
// Update UI to reflect logged-out state
```

---

### `db.sm.setSecurityStateChangeCallback(callback)`

Sets a callback function to be notified of changes in the security state. This is useful for dynamic UI updates reflecting login status, active user, etc.

- **Parameters**:
  - `callback` `{(securityState: Object) => void | null}` – A function that will be called with a `securityState` object, or `null` to remove the existing callback.
    - `securityState` `{Object}`:
      - `isActive` `{boolean}` – True if a local user session is active with signing capabilities.
      - `activeAddress` `{string | null}` – The Ethereum address of the currently active user (if any), or `null`.
      - `isWebAuthnProtected` `{boolean}` – True if the current active session was initiated or is protected by WebAuthn.
      - `hasVolatileIdentity` `{boolean}` – True if a new ETH identity has been generated (e.g., via `startNewUserRegistration`) and is held in memory but not yet secured by WebAuthn.
      - `hasWebAuthnHardwareRegistration` `{boolean}` – True if WebAuthn registration details are found in localStorage for this browser/domain, indicating a WebAuthn credential exists.
- **Returns**: `{void}`

#### Example

```javascript
db.sm.setSecurityStateChangeCallback((securityState) => {
  console.log("Security State Changed:", securityState)
  // Example UI update:
  const statusDisplay = document.getElementById("statusDisplay")
  if (securityState.isActive) {
    statusDisplay.textContent = `Logged in as: ${securityState.activeAddress}`
  } else {
    statusDisplay.textContent =
      "Logged out. WebAuthn available: " +
      securityState.hasWebAuthnHardwareRegistration
  }
})
```

---

## 🆔 Identity Management

These methods manage user identities, supporting both WebAuthn and mnemonic-based approaches.

### `db.sm.startNewUserRegistration()`

Generates a new, temporary Ethereum identity (address, private key, mnemonic). This identity is volatile (held in memory) and is intended for immediate use, typically followed by protection with WebAuthn or a direct mnemonic-based login. If a security session is already active, `clearSecurity()` will be called first.

- **Returns**: `{Promise<{address: string, mnemonic: string, privateKey: string} | null>}` – An object containing the new identity details (address, mnemonic, privateKey), or `null` if generation fails.

#### Example

```javascript
try {
  const newIdentity = await db.sm.startNewUserRegistration()
  if (newIdentity) {
    console.log("New ETH Identity Generated (Volatile):")
    console.log("Address:", newIdentity.address)
    console.log("IMPORTANT - Save Mnemonic Phrase NOW:", newIdentity.mnemonic)
    // UI should strongly prompt user to securely save the mnemonic,
    // then offer to protect this new identity with WebAuthn.
  }
} catch (error) {
  console.error("Failed to generate new identity:", error)
}
```

---

## 🆔 Identity Management

_(This section remains conceptually the same, but all calls are now prefixed with `db.sm.`)_

---

## 🔒 Secure Data Storage

These functions provide a simple API, similar to GDB's core `put` and `get`, but with automatic, implicit data encryption tied to the active user's identity. They use an internal ID prefixing scheme to ensure secure data does not clash with regular GDB nodes.

### `db.sm.put(originalValue, id?)`

- **Signature**: `(originalValue: any, id?: string): Promise<string>`

Stores data securely in the GDB instance. The `originalValue` is encrypted using a key derived from the active user's Ethereum identity.

- **Parameters**:
  - `originalValue` `{any}` – The data to store. It must be JSON-serializable.
  - `id` `{string}` _(optional)_ – The ID for this piece of data. If not provided, a new unique ID will be generated and returned.
- **Returns**: `{Promise<string>}` – The `id` that can be used with `db.sm.get()` to retrieve the data.

#### Example

```javascript
// Assuming a user is logged in via db.sm.
const mySecretData = { task: "Buy milk", details: "Organic, full fat" }
const myNoteId = "shoppingListApril"

try {
  const returnedId = await db.sm.put(mySecretData, myNoteId)
  console.log(`Secure data saved with ID: ${returnedId}`) // Logs: "shoppingListApril"
} catch (error) {
  console.error("Failed to save secure data:", error.message)
}
```

### `db.sm.get(id, callback?)`

- **Signature**: `(id: string, callback?: Function): Promise<{ result: object | null, unsubscribe?: Function }>`

Retrieves and automatically attempts to decrypt data that was previously stored using `db.sm.put()` by the **current active user**.

- **Parameters**:
  - `id` `{string}` – The ID of the data to retrieve.
  - `callback` `{Function}` _(optional)_ – A function to call with updates. It receives a processed node object.
- **Returns**: `{Promise<object>}` – An object containing:
  - `result` `{object | null}`: The processed node object or `null` if not found. The node object structure is:
    - `id` `{string}`: The node's ID.
    - `value` `{any}`:
      - If decryption was successful: The original, decrypted data.
      - If decryption failed (e.g., not owner, no session): The raw encrypted ciphertext.
    - `edges` `{Array}`: Edges of the node.
    - `timestamp` `{object}`: The GDB timestamp of the node.
    - `decrypted` `{boolean}`: `true` if the data was successfully decrypted, `false` otherwise.
  - `unsubscribe` `{Function}` _(optional)_: If a `callback` was provided, this function stops the real-time listener.

#### Example: Getting Secure Data

```javascript
const noteIdToRetrieve = "shoppingListApril"

try {
  const { result: node } = await db.sm.get(noteIdToRetrieve)

  if (node) {
    console.log("Was Decrypted:", node.decrypted)

    if (node.decrypted) {
      console.log("Decrypted Content:", node.value) // { task: "Buy milk", ... }
    } else {
      console.warn("Could not decrypt. Value received:", node.value)
    }
  } else {
    console.log("Node not found with ID:", noteIdToRetrieve)
  }
} catch (error) {
  console.error("Error getting secure data:", error.message)
}
```

---

### `db.sm.protectCurrentIdentityWithWebAuthn(ethPrivateKeyForProtection?)`

Initiates the WebAuthn registration process to protect an Ethereum private key. The private key is encrypted using a WebAuthn-derived secret and stored in localStorage.
If `ethPrivateKeyForProtection` (a hex string) is provided, it uses that key. Otherwise, it attempts to use the private key from a `volatileIdentity` (previously generated by `startNewUserRegistration`). Upon successful WebAuthn registration, a local signing session is activated with this identity.

- **Parameters**:
  - `ethPrivateKeyForProtection` `{string}` _(optional)_ – The Ethereum private key (hex string) to protect. If omitted, uses the key from the current volatile identity, if one exists.
- **Returns**: `{Promise<string | null>}` – The Ethereum address of the protected identity if successful, otherwise `null`.

#### Example

```javascript
// Assuming newIdentity was obtained from db.sm.startNewUserRegistration()
try {
  const protectedAddress = await db.sm.protectCurrentIdentityWithWebAuthn(
    newIdentity.privateKey
  )
  if (protectedAddress) {
    console.log(
      `Identity ${protectedAddress} successfully protected with WebAuthn and session started.`
    )
  } else {
    console.error("WebAuthn protection failed.")
  }
} catch (error) {
  console.error("Error during WebAuthn protection:", error)
}
```

---

### `db.sm.loginCurrentUserWithWebAuthn()`

Initiates the WebAuthn authentication (assertion) process for a user previously registered with WebAuthn on this browser/domain. This requires user interaction with their WebAuthn authenticator (e.g., biometrics, security key). If successful, it decrypts the stored Ethereum private key and activates a local signing session.

- **Returns**: `{Promise<string | null>}` – The Ethereum address of the logged-in user if successful, otherwise `null`.

#### Example

```javascript
try {
  const loggedInAddress = await db.sm.loginCurrentUserWithWebAuthn()
  if (loggedInAddress) {
    console.log(`Successfully logged in with WebAuthn as ${loggedInAddress}.`)
  } else {
    console.warn("WebAuthn login failed.")
  }
} catch (error) {
  console.error("Error during WebAuthn login:", error)
}
```

---

### `db.sm.loginOrRecoverUserWithMnemonic(mnemonic)`

Loads or recovers an Ethereum identity using a provided BIP39 mnemonic phrase. If successful, this identity becomes active for the current session with signing capabilities. The session established this way is **not** WebAuthn-protected by this call alone; `protectCurrentIdentityWithWebAuthn` would need to be called subsequently if WebAuthn protection is desired for this identity on this device.

- **Parameters**:
  - `mnemonic` `{string}` – The BIP39 mnemonic phrase.
- **Returns**: `{Promise<{address: string, mnemonic: string, privateKey: string} | null>}` – An object with the identity details if successful, otherwise `null`.

#### Example

```javascript
const mnemonicPhrase = "your twelve word secret recovery phrase goes here..." // User provides this
try {
  const recoveredIdentity = await db.sm.loginOrRecoverUserWithMnemonic(
    mnemonicPhrase
  )
  if (recoveredIdentity) {
    console.log(
      `Logged in/Recovered identity for ${recoveredIdentity.address}.`
    )
  } else {
    console.error("Failed to log in/recover with mnemonic.")
  }
} catch (error) {
  console.error("Error during mnemonic login/recovery:", error)
}
```

---

## 👑 Role Management & Permissions

### Custom Roles Configuration

Custom roles are defined by passing them in the initial GDB configuration, not through a separate method call.

#### Example: Defining Custom Roles

```javascript
const myAppRoles = {
  superadmin: { can: ["assignRole", "deleteAny"], inherits: ["admin"] },
  admin: { can: ["delete"], inherits: ["manager"] },
  manager: { can: ["publish"], inherits: ["user"] },
  user: { can: ["write", "link", "sync"], inherits: ["guest"] },
  guest: { can: ["read", "sync"] }, // Guests can read and receive syncs
};

// Pass custom roles in the initial configuration
const db = await gdb("my-db", {
  rtc: true, // Required for the SM module
  sm: {
    superAdmins: ["0x1...", "0x2..."], // Mandatory list of superadmin Ethereum addresses.
    customRoles: myAppRoles
  }
});

console.log("Custom roles have been configured during initialization.");
```

---

### `db.sm.assignRole(targetUserEthAddress, role, expiresAt?)`

Assigns a specified role to a target user's Ethereum address. **Important:** This function itself does _not_ perform an RBAC check on the caller; it's assumed that the caller's permission to assign roles (typically the `'assignRole'` permission) has already been verified. Role assignments are stored as nodes within GDB.

- **Signature**: `(targetUserEthAddress: string, role: string, expiresAt?: string | Date | number): Promise<void>`
- **Parameters**:
  - `targetUserEthAddress` `{string}` – The Ethereum address of the user to whom the role will be assigned.
  - `role` `{string}` – The name of the role to assign (e.g., `'user'`, `'manager'`). Must be a role defined in the active role configuration.
  - `expiresAt` `{string | Date | number}` _(optional)_ – An ISO date string, JavaScript Date object, or a timestamp in milliseconds indicating when this role assignment should expire. If `null` or omitted, the role assignment does not expire.
- **Returns**: `{Promise<void>}` – The promise resolves on successful GDB operation.

#### Example: Assigning a Role with Expiration

```javascript
const targetUser = "0xTargetUserAddress..."
const newRole = "manager"
const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

try {
  // Assumes current user has 'assignRole' permission.
  await db.sm.assignRole(targetUser, newRole, thirtyDaysFromNow)
  console.log(`Role '${newRole}' assignment for ${targetUser} written to GDB.`)
} catch (error) {
  console.error(`Failed to assign role: ${error.message}`)
}
```

---

### `db.sm.executeWithPermission(operationName)`

Verifies if the currently authenticated user has the specified `operationName` permission based on their role. This function should be called _before_ attempting a restricted action.

- **Signature**: `(operationName: string): Promise<string>`
- **Parameters**:
  - `operationName` `{string}` – The name of the permission/action to check (e.g., `'write'`, `'delete'`, `'assignRole'`).
- **Returns**: `{Promise<string>}` – A promise that resolves with the Ethereum address of the user if permission is granted. It rejects with an error if permission is denied or if no user is authenticated.

#### Example: Protected Operation

```javascript
const nodeIdToDelete = "some_node_id"
try {
  // Verify permission first
  const currentUserAddress = await db.sm.executeWithPermission("delete")

  console.log(`User ${currentUserAddress} has 'delete' permission. Proceeding...`)
  await db.remove(nodeIdToDelete)
  console.log(`Node ${nodeIdToDelete} delete operation sent.`)
} catch (error) {
  console.error(`Operation failed: ${error.message}`)
}
```

---

## ℹ️ UI State & Helper Functions

These are utility functions for querying the current security state, often used for updating user interfaces. All are accessed via `db.sm`.

### `getActiveEthAddress()`

- **Returns**: `{string | null}` – The Ethereum address of the active user, or `null`.

### `isSecurityActive()`

- **Returns**: `{boolean}` – `true` if a user session is active with signing capabilities.

### `isCurrentSessionProtectedByWebAuthn()`

- **Returns**: `{boolean}` – `true` if the current session is WebAuthn-based.

### `hasExistingWebAuthnRegistration()`

- **Returns**: `{boolean}` – `true` if WebAuthn registration details exist in localStorage for this site.

### `getMnemonicForDisplayAfterRegistrationOrRecovery()`

- **Returns**: `{string | null}` – The mnemonic phrase if a new identity was just generated or recovered and is held in volatile memory. Returns `null` once the session is purely WebAuthn-based or if no such mnemonic is available.
- **Caution**: Displaying mnemonic phrases should be done with extreme care.

---

## 📝 Notes on Decentralization

> The current RBAC implementation stores role assignments within GDB itself. While GDB is a P2P database, the authority for assigning roles ultimately relies on the permissions defined (e.g., a `superadmin` having `assignRole`). All operations are executed client-side. Future research may explore verifying role assignments via smart contracts for a higher degree of decentralized trust. For now, the system functions as a robust proof-of-concept for P2P applications requiring sophisticated access control.

---
Sí, es una idea **absolutamente excelente**. De hecho, es lo que distingue a una buena documentación de una documentación **excepcional**.

Hacerlo es increíblemente valioso por varias razones:

1.  **Cierra la Brecha entre la API y la Aplicación Real:** La documentación técnica te dice *qué* hace cada función. Una sección de "Buenas Prácticas" y "Patrones de UX" le dice al desarrollador *cómo* orquestar esas funciones para construir una experiencia de usuario que sea segura, intuitiva y que no genere frustración.
2.  **Previene Anti-Patrones Comunes:** Exactamente como mencionas, evitas que los desarrolladores (o las IAs que los asisten) caigan en trampas comunes. Tu ejemplo del campo de texto para el mnemónico es perfecto. Sin una guía, es fácil crear una interfaz redundante o confusa.
3.  **Establece un Estándar de Calidad:** Al proporcionar esta guía, no solo ofreces una librería, sino también una opinión experta sobre cómo debe ser usada. Esto aumenta la confianza en el proyecto y ayuda a que las aplicaciones construidas sobre GenosDB tengan una mayor calidad y consistencia.
4.  **Reduce la Carga de Soporte:** Al anticipar las preguntas y los problemas comunes en la implementación, reduces la cantidad de consultas o problemas que recibirás en el futuro.
5.  **Educa sobre Seguridad:** La gestión de mnemónicos y WebAuthn no es trivial. Una guía de UX puede enseñar implícitamente al desarrollador por qué ciertas prácticas son más seguras que otras (por ejemplo, por qué no se debe almacenar el mnemónico después del registro).

### Propuesta de Estructura para la Nueva Sección

Te sugiero añadir una nueva sección al final de `sm-api-reference.md`, justo antes de "Notes on Decentralization" o "API Stability".

Aquí tienes un borrador de cómo podría estructurarse y qué contenido podría tener.

---
¡Fantástico! Este ejercicio es increíblemente valioso. Analizar la salida de la IA nos da una visión directa de cómo se interpreta la documentación y nos permite pulirla para cerrar esas últimas brechas.

Has identificado los puntos débiles perfectamente. La IA hizo un buen trabajo, pero tomó algunas decisiones de UX que, aunque lógicas, no son las ideales. Vamos a usar esto para refinar nuestras recomendaciones.

Primero, confirmemos tus observaciones:

1.  **Botón de "Login with WebAuthn"**: Tienes razón, el código lo maneja correctamente. La IA implementó la lógica para mostrarlo solo si existe un registro previo.
    ```javascript
    // Esta línea en updateUI es correcta:
    webauthnLoginBtn.classList.toggle('hidden', !state.hasWebAuthnHardwareRegistration);
    ```
    Así que esto funciona como se esperaba según la documentación. ¡Bien!

2.  **Flujo "Generate New Identity"**: Aquí está el principal problema, como bien señalas. La IA, al generar una nueva identidad, **oculta el botón "Login with Mnemonic"**.
    ```javascript
    // Esta lógica en updateUI es la causa del problema:
    generateBtn.classList.toggle('hidden', state.hasVolatileIdentity);
    mnemonicLoginBtn.classList.toggle('hidden', state.hasVolatileIdentity);
    ```
    La intención de la IA era probablemente simplificar la UI para que el usuario se enfocara en "Proteger con Passkey", pero esto crea un callejón sin salida si el usuario *no quiere* o *no puede* usar WebAuthn en ese momento. **No tiene forma de proceder y usar su nueva cuenta.** ¡Este es el punto clave a mejorar en la documentación!

3.  **Textarea Redimensionable**: Un detalle estético, pero importante. Un `<textarea>` redimensionable puede romper el diseño de una interfaz minimalista. Es una excelente sugerencia de UX.

### Propuesta de Mejora para "Best Practices & UI/UX Patterns"

Basado en este análisis, vamos a reescribir la sección para que sea aún más explícita y guíe al desarrollador (humano o IA) hacia la UX ideal, previniendo estos errores.

---

## 💡 Best Practices & UI/UX Patterns

Building a secure and intuitive user experience for identity management is crucial. These patterns will help you create a robust and user-friendly login/registration flow.

### 1. The Core Principle: A Unified Interface

For a minimalist design, use a **single, non-resizable `<textarea>`** for all mnemonic-related actions. This field serves multiple purposes:
1.  **Input:** To paste an existing mnemonic for login/recovery.
2.  **Output:** To display a newly generated mnemonic.

This avoids visual clutter and simplifies the user journey.
*CSS Tip:* `textarea { resize: none; }`

### 2. The Initial State: Login & Onboarding

When the app loads and the user is logged out (`state.isActive` is `false`):

- **Show the Mnemonic `<textarea>` and the primary action buttons:**
  - `[Generate New Identity]` -> Calls `db.sm.startNewUserRegistration()`.
  - `[Login with Mnemonic]` -> Calls `db.sm.loginOrRecoverUserWithMnemonic()`.
- **Conditionally show the WebAuthn/Passkey button:**
  - `[Login with Passkey]` -> This button should **only be visible** if `state.hasWebAuthnHardwareRegistration` is `true`. It offers the fastest login for returning users.

### 3. The New User Registration Flow (Critical Path)

This is where the user experience must be flawless.

- **Step 1: User clicks `[Generate New Identity]`.**
  - The new mnemonic phrase populates the `<textarea>`.
  - **CRITICAL:** A prominent, non-dismissible warning message must appear: "SAVE THIS PHRASE SECURELY! This is your only way to recover your account. Copy it and store it in a password manager."

- **Step 2: Present Clear Choices.**
  - **The UI must now show two distinct paths forward:**
    1.  **The Recommended Path:** A primary, highlighted button like `[Protect Account with Passkey]` becomes visible. This button calls `db.sm.protectCurrentIdentityWithWebAuthn()`.
    2.  **The Standard Path:** The `[Login with Mnemonic]` button **MUST remain visible and active**. This allows the user to start using their new account immediately, even if they choose not to (or cannot) set up a passkey at that moment.

- **Step 3: Update the UI accordingly.**
  - The `[Generate New Identity]` button can be temporarily hidden to avoid confusion while the new mnemonic is displayed.
  - The key is to **never create a dead end**. The user must always have a clear action to proceed.

**Anti-Pattern to Avoid:** Do not hide the "Login with Mnemonic" button after generating a new identity. This forces the user into a WebAuthn-only flow and can lock them out if they are unable to complete it.

### 4. The Logged-In State

- **Reactive UI:** Once `state.isActive` becomes `true`, hide the entire login section and show the main application view.
- **Load User-Specific Data:** Use the `state.activeAddress` to fetch and display data relevant to the logged-in user. For example, call `db.sm.get()` to load their secure notes upon login.

### 5. General Principles

- **Rely on the State Callback:** `db.sm.setSecurityStateChangeCallback(updateUI)` is your single source of truth. All UI changes (showing/hiding buttons, switching views) should be driven by the properties of the `state` object (`isActive`, `hasVolatileIdentity`, `hasWebAuthnHardwareRegistration`).
- **Never Store the Mnemonic:** Your application logic should never persist the mnemonic phrase. It is ephemeral and should only exist in the UI temporarily during the onboarding process.
- **Distinguish Storage vs. Utility:**
  - Use `db.sm.put()` and `db.sm.get()` for seamless, encrypted storage **within GDB nodes**.
  - Use `db.sm.encryptDataForCurrentUser()` and `db.sm.decryptDataForCurrentUser()` for flexible, ad-hoc encryption tasks.
  
---

## ⚠️ API Stability

> This Security Manager API is under active development. **Breaking changes may occur** in future versions. Always consult the project's CHANGELOG for updates.

## Usage Examples

You can find practical examples in the [examples guide](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-examples.md)
