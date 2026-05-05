# Sansistore

Internal team docs and contribution workflow for the Sansistore project.

## Docs

Project documentation (start here): https://procesosagilesumss.github.io/sansistore/

## Environments (Vercel)

| Branch       | Purpose                    | Deploy URL                         |
| ------------ | -------------------------- | ---------------------------------- |
| `main`       | Staging / QA (pre-release) | https://sansistore-test.vercel.app |
| `production` | Production (live)          | https://sansistore-umss.vercel.app |

## New dev quick start

```bash
bun install
bun dev
```

### Local emulators (Firestore + Auth)

For local development you can run the Firebase emulators for Firestore and Auth. The project includes an `emu` script that starts both emulators using the configuration in `firebase.json`:

```bash
# starts Firestore and Auth emulators
bun run emu
```

When `PUBLIC_APP_ENV` is not `production` the frontend will automatically connect to the emulators (Firestore on localhost:8080, Auth on localhost:9099). See `src/lib/firebase.ts` for details.

Seeding local emulator

The project includes a seeder at `seed/index.mjs` and a `seed/seed-products.mjs` example. Run the seeder with:

```bash
# run all seeders
bun run seed
# run an individual seeder
node ./seed/index.mjs seed-products
```

The seeder defaults to the Firestore emulator (it sets `FIRESTORE_EMULATOR_HOST=localhost:8080` if not provided) so it will not write to production by accident.

For the current catalog seed, you can also sync products directly to Firestore with `node --env-file=.env scripts/push-products-to-firestore.mjs`.

Java requirement

- The Firebase Local Emulator requires Java 21 or newer. Confirm by running `java -version` and install/update Java if needed before running `bun run emu`.

Scripts:

```bash
bun dev
bun build
bun preview
bun astro check
```

If you need environment variables (Firebase, etc.), ask the team for the current `.env` values or check the Vercel project settings.

## Data model

This is the base Firestore model. The database uses consistent English names for collections and fields.

```mermaid
classDiagram
  class users {
    +string uid
    +string email
    +string displayName
    +array roles
    +string institutionalId
    +boolean isActive
    +string createdBy
    +timestamp createdAt
  }

  class locations {
    +string locationId
    +string userId
    +string label
    +string type
    +number lat
    +number lng
    +boolean isDefault
  }

  class categories {
    +string categoryId
    +string name
    +boolean active
    +string createdBy
    +timestamp createdAt
  }

  class products {
    +string productId
    +string categoryId
    +string name
    +string slug
    +string description
    +number price
    +string imageUrl
    +boolean active
    +boolean hasOffer
    +number offerPrice
    +string badge
    +string sourceUrl
  }

  class inventory {
    +string productId
    +number stockTotal
    +number stockAvailable
    +number stockReserved
    +number minStock
    +boolean enabled
  }

  class inventoryMovements {
    +string movementId
    +string productId
    +string operatorId
    +string type
    +number quantity
    +timestamp createdAt
  }

  class reviews {
    +string reviewId
    +string productId
    +string authorName
    +number rating
    +string comment
    +boolean active
    +timestamp createdAt
  }

  class orders {
    +string orderId
    +string buyerId
    +string sellerId
    +string status
    +string incidentReason
    +number total
    +string locationId
    +string paymentStatus
    +string deliveryStatus
    +string deliveryId
    +string paymentId
    +timestamp confirmedAt
    +timestamp cancelledAt
    +timestamp createdAt
    +timestamp updatedAt
  }

  class orderItems {
    +string itemId
    +string productId
    +string productName
    +number unitPrice
    +number quantity
    +number subtotal
  }

  class deliveries {
    +string deliveryId
    +string orderId
    +string courierId
    +string status
    +string deliveryCode
    +number attemptNumber
    +string incidentReason
    +string evidenceUrl
    +string failureReason
    +number amountCollected
    +boolean customerConfirmed
    +timestamp customerConfirmedAt
    +timestamp assignedAt
    +timestamp pickedUpAt
    +timestamp deliveredAt
    +timestamp inTransitAt
    +timestamp pickedUpAt
    +timestamp deliveredAt
    +timestamp failedAt
    +timestamp reprogrammedAt
    +timestamp createdAt
    +timestamp updatedAt
  }

  class payments {
    +string paymentId
    +string orderId
    +number amount
    +string method
    +string status
    +string registeredBy
    +string verifiedBy
    +timestamp registeredAt
    +timestamp verifiedAt
    +timestamp updatedAt
  }

  class courierSessions {
    +string sessionId
    +string courierId
    +number totalCollected
    +number deliveriesCount
    +number expectedAmount
    +number differenceAmount
    +string status
    +timestamp openedAt
    +timestamp closedAt
    +string validatedBy
    +timestamp validatedAt
    +timestamp updatedAt
  }

  class notifications {
    +string notificationId
    +string userId
    +string orderId
    +string type
    +string title
    +string message
    +boolean read
    +timestamp createdAt
    +timestamp updatedAt
  }

  class settings {
    +string documentId
    +number reservationTimeLimit
  }

  users "1" --> "0..*" locations : owns
  users "1" --> "0..*" orders : places
  users "1" --> "0..*" reviews : writes
  categories "1" --> "0..*" products : contains
  products "1" *-- "1" inventory : subcollection
  inventory "1" --> "0..*" inventoryMovements : logs
  products "1" --> "0..*" reviews : has
  orders "1" *-- "1..*" orderItems : subcollection
  orders "1" --> "1" deliveries : has
  orders "1" --> "1" payments : has
  deliveries "0..*" --> "1" courierSessions : belongs
  users "1" --> "1" settings : configures
  users "1" --> "0..*" notifications : receives
  orders "1" --> "0..*" notifications : triggers
```

### Technical notes

The model is a good base for an ecommerce app with delivery. Keep these implementation details consistent:

- In Firestore, you do not always need to store `productId`, `orderId`, etc. inside the document if the document ID already represents that value. Store it only when exports or search flows need it.
- In the current catalog seed, `products` and `reviews` use UUIDs as Firestore document IDs. In practice, the `productId` and `reviewId` shown in this diagram can map to the document ID itself.
- `inventoryMovements` should belong under `products` or live as a root collection indexed by `productId`. Nesting it under `inventory` can make global audit queries harder.
- `products` should include a human-readable `description` for the catalog detail flow. Optional presentation fields such as `badge` and `sourceUrl` can be stored when the frontend needs merchandising labels or traceability of seeded data.
- `reviews` can be seeded with `authorName` when there is no authenticated `userId` yet. Once buyer reviews are enabled, define whether both fields will coexist or whether `authorName` becomes derived display data.
- Define closed values for `role`, `status`, `type`, and `method` from the start to avoid inconsistent states.
- Delivery lifecycle timestamps must be stored in `deliveries`: `assignedAt`, `pickedUpAt`, and `deliveredAt`, to support tracking and performance metrics.
- `evidenceUrl` is optional and stores delivery or incident evidence when required.
- (TODO) `roles` is an array accepting: admin | vendedor | mensajero | operador | comprador. Example: ["admin", "comprador"] -> CHECK. Use array-contains for queries.

## Branching and releases

Daily work:

1. Create a branch from `main` (`feature/*`, `fix/*`, `chore/*`).
2. Open a PR back into `main`.
3. Merge only when CI is green and the PR is approved.

End of sprint (release):

1. Open a pull request `main` → `production`.
2. Merge after QA sign-off.

Hotfixes:

1. Branch from `production` (`hotfix/*`).
2. PR into `production`.
3. Back-merge `production` → `main` (so QA stays in sync).

## Daily report (on the team issue)

Each team has one open issue for the sprint. Every day, each member adds one comment using:

```markdown
- **Yesterday:** <what you did> (include commit SHAs / PR/Issue # if relevant)
- **Today:** <what you will do>
- **Blockers:** <None | describe + what you need>
```

## Global rules

- Never force-push to `main` or `production`.
- Never push directly to `main` or `production`.
- Always start from an issue (User Story / Bug / Task).
- Use the PR template and keep descriptions clear.
- CI must pass before merging.
