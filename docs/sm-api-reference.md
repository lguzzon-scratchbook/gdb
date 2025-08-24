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
>   rtc: true, 
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
> **Note on Automatic Initialization**: When you provide the `sm` configuration object, the `gdb` function automatically handles all necessary internal initialization logic. This includes setting up the security context, registering the P2P middleware, and attempting a silent WebAuthn session resume. The `db` instance you receive is fully prepared for use with all Security Manager features.

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
    rtc: true,
    sm: {
      superAdmins: ["0x1...", "0x2..."], // superadmin addresses
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
  rtc: true,
  sm: {
    superAdmins: ["0x1...", "0x2..."], // superadmin addresses (mandatory)
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

Note: Some example pages explicitly create the Security Context after initialization to ensure the silent resume logic runs immediately. If you enable SM via `sm: { superAdmins: [...] }`, the context is automatically set up by the module. The `superAdmins` field is mandatory; without it, the SM module will not initialize.

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
  sm: {
    superAdmins: ["0x1...", "0x2..."] // superadmin addresses (mandatory)
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

## ⚠️ API Stability

> This Security Manager API is under active development. **Breaking changes may occur** in future versions. Always consult the project's CHANGELOG for updates.

## Usage Examples

You can find practical examples in the [examples guide](https://github.com/estebanrfp/gdb/blob/main/docs/genosdb-examples.md)
