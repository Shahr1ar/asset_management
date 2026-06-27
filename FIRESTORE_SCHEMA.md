# Firestore Schema Design

## Collections

### `users`

Each user document represents a member or admin.

Fields:

- `displayName`: string
- `email`: string
- `role`: string (`admin` | `member`)
- `status`: string (`active` | `paused` | `disabled`)
- `createdAt`: timestamp
- `walletId`: string
- `profilePhotoUrl`: string
- `metadata`: map

Example document path: `users/{uid}`

#### `users/{uid}/currentData/main`

Stores the editable latest financial item values for a user.

Fields:

- `items`: array<map>
  - `key`: string
  - `title`: string
  - `description`: string
  - `defaultValue`: number
  - `type`: string (`income` | `expense` | `asset` | `liability` | `metric`)
  - `editable`: boolean
  - `enabled`: boolean
  - `isActive`: boolean
  - `order`: number
  - `createdAt`: string
  - `updatedAt`: string
  - `value`: number
- `updatedAt`: string or timestamp

Only this document should be edited during normal user financial updates.

#### `users/{uid}/monthly_history/{YY.MM}`

Stores a read-only monthly snapshot copied from `currentData/main`.
The document ID is the month key, for example `26.05` for May 2026.
Saving again in the same month overwrites the same document so only the latest version for that month remains.
The admin panel History page uses the `Store Data` action to save this snapshot for all users manually.

Fields:

- `id`: string (`YY.MM`)
- `key`: string (`YY.MM`)
- `month`: string (`MM`)
- `year`: number
- `label`: string
- `items`: array<map>
  - `key`: string
  - `title`: string
  - `description`: string
  - `defaultValue`: number
  - `type`: string (`income` | `expense` | `asset` | `liability` | `metric`)
  - `editable`: boolean
  - `enabled`: boolean
  - `isActive`: boolean
  - `order`: number
  - `createdAt`: string
  - `updatedAt`: string
  - `value`: number
- `createdAt`: string
- `updatedAt`: string
- `storedAt`: string
- `currentDataUpdatedAt`: string or timestamp or null
- `source`: string (`manual`)

---

### `properties`

Real estate listings managed by admins and displayed (read-only) in the mobile app.
Admins have full CRUD access; signed-in app users can read. Property image is optional
(`imageUrl` is an empty string when none is set, and the app shows a placeholder).

Fields:

- `id`: string (matches the document id)
- `title`: string
- `description`: string
- `price`: number
- `priceType`: string (e.g. `month`, `total`)
- `propertyType`: string (`sale`)
- `address`: string
- `latitude`: number
- `longitude`: number
- `bedrooms`: number (int)
- `bathrooms`: number (int)
- `area`: number (sq ft)
- `features`: array<string>
- `ownerName`: string
- `phoneNumber`: string
- `whatsappNumber`: string
- `imageUrl`: string (Firebase Storage download URL or empty)
- `isActive`: boolean
- `createdAt`: timestamp
- `updatedAt`: timestamp

Property images are stored in Firebase Storage under `properties/{propertyId}/{fileName}`.

Example document path: `properties/{propertyId}`

---

### `wallets`

Each wallet tracks balance and wallet history for a user.

Fields:

- `userId`: string
- `balance`: number
- `currency`: string
- `updatedAt`: timestamp
- `history`: array<map>
  - `amount`: number
  - `type`: string (`recharge` | `withdraw` | `bonus` | `adjustment`)
  - `note`: string
  - `createdAt`: timestamp

Example document path: `wallets/{walletId}`

---

### `transactions`

A master transaction collection for admin reporting.

Fields:

- `userId`: string
- `userName`: string
- `type`: string (`revenue` | `withdraw` | `recharge` | `bonus`)
- `amount`: number
- `status`: string (`completed` | `pending` | `failed`)
- `source`: string
- `description`: string
- `createdAt`: timestamp
- `metadata`: map

Example document path: `transactions/{transactionId}`

---

### `reports`

Operational summary documents for analytics.

Fields:

- `period`: string (`2026-05` or `Q2-2026`)
- `totalRevenue`: number
- `totalWithdraw`: number
- `totalRecharge`: number
- `totalBonus`: number
- `cogs`: number
- `grossProfit`: number
- `netBalance`: number
- `updatedAt`: timestamp

Example document path: `reports/{reportId}`
