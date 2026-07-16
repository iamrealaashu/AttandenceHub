# Attendance Management Web App

A simple attendance website with:
- quick attendance marking for present, half-day, and absent
- worker add/edit/remove management
- instant search by worker name or phone
- monthly attendance reporting

## Run locally

1. Install server dependencies:
   - npm install in the server folder
2. Start the API:
   - node server/index.js
3. Open the client in a browser:
   - open client/index.html

## Test

Run the server-side tests:
- node --test server/tests/attendanceService.test.js
