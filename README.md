# IoT Device Management API

A RESTful API for registering, controlling and auditing smart home devices.
Built with Node 24, TypeScript, Express 5, Zod 4, Drizzle ORM and SQLite.

Three device types, each with its own state shape:

| Type         | State fields                                                     |
| ------------ | ---------------------------------------------------------------- |
| `light`      | `on` (boolean), `brightness` (0–100)                             |
| `thermostat` | `targetTemp` (5–30), `currentTemp`, `mode` (`heat`/`cool`/`off`) |
| `camera`     | `recording` (boolean), `motionDetected` (boolean)                |

Every change to a device's state is recorded in the device events table for audit history.

## Installation

Run the following commands to install and run the program:

```bash
npm install
```
```bash
npm run dev
```


To populate the database with six demo devices:

```bash
npm run seed
```

API server: `http://localhost:3000`

Swagger UI: `http://localhost:3000/docs`


## Assumptions/Implementation

The API was designed to be maintainable and extensible, with a device class hierarchy and per-state tables to avoid later DB migrations
Deleting a device should not perform a DELETE operation on the database to maintain audit history (ie. soft delete)
User model/Authentication was treated as out of scope
SQLite DB was used for portability, but wouldn't be used in production. 

### Scripts

| Script                | Description                                 |
| --------------------- | ------------------------------------------- |
| `npm run dev`         | Start the server, reloading on file changes |
| `npm run seed`        | Insert demo devices                         |
| `npm test`            | Run the tests                               |
| `npm run lint`        | Lint with ESLint                            |
| `npm run typecheck`   | Type check without emitting                 |
| `npm run format`      | Format with Prettier                        |

### API Endpoints

| Method   | Path                          | Success | Description                                    |
| -------- | ----------------------------- | ------- | ---------------------------------------------- |
| `POST`   | `/api/v1/devices`             | 201     | Register a device. Returns a `Location` header |
| `GET`    | `/api/v1/devices`             | 200     | List devices, excluding deleted ones           |
| `GET`    | `/api/v1/devices/:id`         | 200     | Retrieve a single device                       |
| `PATCH`  | `/api/v1/devices/:id`         | 200     | Update `name`, `room` or `firmwareVersion`     |
| `PATCH`  | `/api/v1/devices/:id/state`   | 200     | Change device state                            |
| `GET`    | `/api/v1/devices/:id/history` | 200     | List the device's events, newest first         |
| `DELETE` | `/api/v1/devices/:id`         | 204     | Delete a device                                |

### Errors

| Status | Meaning                                                                 |
| ------ | ----------------------------------------------------------------------- |
| 400    | Malformed request body                                                  |
| 404    | Device or route does not exist                                          |
| 409    | A device with this manufacturer and serial number is already registered |
| 422    | Request body failed validation                                          |


