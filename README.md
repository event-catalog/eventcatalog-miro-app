## EventCatalog Miro App

Import your EventCatalog resources directly into your Miro board.

This let's you see and use your EventCatalog services, events, commands and queries directly in your Miro board for collaboration with your team.

## Installation

- Go to the the [installation URL](https://miro.com/app-install/?response_type=code&client_id=3458764623600229458&redirect_uri=%2Fapp-install%2Fconfirm%2F)
- Click **Install App**
- Use the app on your board

### Importing resources

You have two options:

1. Import resources from a URL
2. Import resources from a JSON file

#### Importing resources from a URL

- Open the miro application and enter the URL of the EventCatalog (must be public)
- Your resources will be imported into the board
- Drag and drop the resources to the board where you want them

#### Importing resources from a JSON file

- Navigate to your EventCatalog instance and download the JSON file
- Open the API route `api/catalog`
- Save the JSON file to your local machine
- Load the JSON file into the app
- Drag and drop the resources to the board where you want them

### Roadmap

- [x] Let users import resources from EventCatalog from a URL
- [x] Let users import resources from a JSON file
- [] Get published on Miro Marketplace
- [ ] Let users create resource types
- [ ] Export designs back into EventCatalog

### Contributing

**&nbsp;ℹ&nbsp;Note**:

- We recommend a Chromium-based web browser for local development with HTTP. \
  Safari enforces HTTPS; therefore, it doesn't allow localhost through HTTP.
- For more information, visit our [developer documentation](https://developers.miro.com).

### How to start locally

- Run `npm i` to install dependencies.
- Run `npm start` to start developing. \
  Your URL should be similar to this example:
 ```
 http://localhost:3000
 ```
- Paste the URL under **App URL** in your
  [app settings](https://developers.miro.com/docs/build-your-first-hello-world-app#step-3-configure-your-app-in-miro).
- Open a board; you should see your app in the app toolbar or in the **Apps**
  panel.

### How to build the app

- Run `npm run build`. \
  This generates a static output inside [`dist/`](./dist), which you can host on a static hosting
  service.

### Folder structure

<!-- The following tree structure is just an example -->

```
.
├── src
│  ├── assets
│  │  └── style.css
│  ├── app.tsx      // The code for the app lives here
│  └── index.ts    // The code for the app entry point lives here
├── app.html       // The app itself. It's loaded on the board inside the 'appContainer'
└── index.html     // The app entry point. This is what you specify in the 'App URL' box in the Miro app settings
```
