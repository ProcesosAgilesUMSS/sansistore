# Sansistore

Internal team docs and contribution workflow for the Sansistore project.

## Environments (Vercel)

| Branch       | Purpose                    | Deploy URL                         |
| ------------ | -------------------------- | ---------------------------------- |
| `main`       | Staging / QA (pre-release) | https://sansistore-test.vercel.app |
| `production` | Production (live)          | https://sansistore-umss.vercel.app |

## Requirements

- [Bun](https://bun.sh)
- Java 21 (for Firestore emulator)

## New dev quick start

```bash
bun install
bun dev
```

### Local emulators

Run Firestore and Auth emulators:

```bash
bun run emu
```

The frontend uses emulators when `PUBLIC_APP_ENV` is not `production` (Firestore: localhost:8080, Auth: localhost:9099).

### Seeding

Add test data to the local emulator:

```bash
bun run seed
```


If you need environment variables (Firebase, etc.), ask the team for the current `.env` values or check the Vercel project settings.

## Testing Environment

The repo contains the e2e testing suite powered by Playwright and Bun. To ensure consistent test results, you can run tests either directly on your machine or via Docker.

### Native Setup

Follow these steps to run tests directly on your OS.

**Prerequisites**

- Bun: [Installation Guide](https://bun.sh)
- Java 21: Required for the Firestore Emulator.
- Playwright Browsers: [Install the required binaries](https://playwright.dev/docs/browsers).

**Installation**

Install dependencies:

```bash
bun install
```

Install Playwright browsers and dependencies:

```bash
bunx playwright install --with-deps
```

**Running Tests**

- Run all tests: `bunx playwright test`
- Run a specific file: `bunx playwright test path/to/test.spec.ts`
- Run tests matching a name: `bunx playwright test -g "login"`
- View report: `bunx playwright show-report`

### Docker Usage

Use Docker to ensure a clean, isolated environment that matches CI.

**Basic Commands**

Run all tests:

```bash
docker compose up testing
```

Run specific tests:

```bash
docker compose run --rm testing bunx playwright test path/to/test.spec.ts
```

**Viewing Results**

Since the container shares volumes with your host, you can view the report generated inside Docker on your native machine:

```bash
bunx playwright show-report
```

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
    +number soldCount
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

  class cartItems {
    +string cartItemId
    +string userId
    +string productId
    +number quantity
    +timestamp updatedAt
  }

  class favorites {
    +string favoriteId
    +string userId
    +string productId
    +timestamp createdAt
  }

  users "1" --> "0..*" locations : owns
  users "1" --> "0..*" orders : places
  users "1" --> "0..*" reviews : writes
  users "1" --> "0..*" cartItems : has
  users "1" --> "0..*" favorites : saves
  categories "1" --> "0..*" products : contains
  products "1" *-- "1" inventory : subcollection
  products "1" --> "0..*" cartItems : referenced in
  products "1" --> "0..*" favorites : saved in
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

## Daily report

Use `@ScrumReports/` to log daily progress. Each team has a report file in `ScrumReports/` (e.g., `scrum_report_core_devs.md`).

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

## Docs

Project documentation (start here): https://procesosagilesumss.github.io/sansistore/
