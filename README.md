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
    +number price
    +string imageUrl
    +boolean active
    +boolean hasOffer
    +number offerPrice
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
    +string userId
    +number rating
    +string comment
    +timestamp createdAt
  }

  class orders {
  +string orderId
  +string buyerId
  +string sellerId
  +string status
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
  +string orderId
  +string buyerId
  +string sellerId
  +string status
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
  +string failureReason
  +number amountCollected
  +boolean customerConfirmed
  +timestamp customerConfirmedAt
  +timestamp assignedAt
  +timestamp pickedUpAt
  +timestamp deliveredAt
  +timestamp failedAt
  +timestamp reprogrammedAt
  +timestamp createdAt
  +timestamp updatedAt
  +string deliveryId
  +string orderId
  +string courierId
  +string status
  +string deliveryCode
  +number attemptNumber
  +string incidentReason
  +string failureReason
  +number amountCollected
  +boolean customerConfirmed
  +timestamp customerConfirmedAt
  +timestamp assignedAt
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

The model is a good base for an ecommerce app with delivery, with three implementation details to keep consistent:

- In Firestore, you do not always need to store `productId`, `orderId`, etc. inside the document if the document ID already represents that value. Store it only when exports or search flows need it.
- `inventoryMovements` should belong under `products` or live as a root collection indexed by `productId`. Nesting it under `inventory` can make global audit queries harder.
- Define closed values for `role`, `status`, `type`, and `method` from the start to avoid inconsistent states.
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
