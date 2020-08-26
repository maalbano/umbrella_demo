'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "favicon.ico": "e4f90463541ecb7a50ceca689c036006",
"index.html": "d683a799a67480179f4c7f673befee37",
"/": "d683a799a67480179f4c7f673befee37",
"main.dart.js": "176499e5f1f6b804b32b0d1a52605f0d",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "c15b863123c34e192c6eb39fbf8703b6",
"icons/Icon-512.png": "434fa94082ed42439e71eac91c53fc54",
"manifest.json": "a97b77f3f868a1bf09f780ec62226bb1",
"assets/AssetManifest.json": "446e0849675fc25d0bc841086cbb2ee5",
"assets/NOTICES": "3477f1ce479ffbb6545281dfce6b0eb6",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "115e937bb829a890521f72d2e664b632",
"assets/fonts/MaterialIcons-Regular.otf": "a68d2a28c526b3b070aefca4bac93d25",
"assets/assets/8.jpg": "ec579e91a0018625058f862fd5abf47b",
"assets/assets/9.jpg": "ed6cc47ec252bd0786e3262ab50c24e3",
"assets/assets/end.jpg": "2c5f923f922f5e22fce297909ef4f511",
"assets/assets/10.jpg": "28f8fe5a31db4f9ff675c983c59ab83b",
"assets/assets/voice/8.m4a": "ee3a97764455a44ffce4959569be5bf4",
"assets/assets/voice/9.m4a": "0e23008b370d66e0b6762ae64db4e8be",
"assets/assets/voice/10.m4a": "6f1304e5abb458b68b8ee6835a0c0e9b",
"assets/assets/voice/end.m4a": "586f136eca3e2ac03a3cbdbcfb94bda3",
"assets/assets/voice/cover.m4a": "115d9a4012c93fc442d834ca42899fa0",
"assets/assets/voice/1.m4a": "ebf3131a25100972ddbdf40ddbef19e8",
"assets/assets/voice/2.m4a": "da40137c29696f5225111681647b9d34",
"assets/assets/voice/3.m4a": "3353114e3fc50cb50bce0852949e3732",
"assets/assets/voice/7.m4a": "0cb9dba9667532867c3e15217e3be840",
"assets/assets/voice/6.m4a": "acdaebe84105de46c8bc11a43920fbe3",
"assets/assets/voice/4.m4a": "e9a13aa2c8033798f67dd96bf5d9a4e7",
"assets/assets/voice/5.m4a": "a4355b9df25c47bbcd5f9705c9220f3a",
"assets/assets/cover.jpg": "6d3574cd69f5fffe0f578dbe9f750999",
"assets/assets/4.jpg": "9060aa1c952c327191ea9a89c6e1455d",
"assets/assets/5.jpg": "dac3cec7ff7a59d31be9765ec01d334d",
"assets/assets/7.jpg": "f119255f9a184fb301cd50852989b78f",
"assets/assets/6.jpg": "a7c9711168b316e4ca54e10514c1e72d",
"assets/assets/2.jpg": "1de9558d1468d08fc65d9bc35c98e93b",
"assets/assets/3.jpg": "ab26743253e439652066151579f0752d",
"assets/assets/1.jpg": "4ff491835af8f508a49eee44336c4742"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      // Provide a 'reload' param to ensure the latest version is downloaded.
      return cache.addAll(CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');

      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }

      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#')) {
    key = '/';
  }
  // If the URL is not the RESOURCE list, skip the cache.
  if (!RESOURCES[key]) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache. Ensure the resources are not cached
        // by the browser for longer than the service worker expects.
        var modifiedRequest = new Request(event.request, {'cache': 'reload'});
        return response || fetch(modifiedRequest).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    return self.skipWaiting();
  }

  if (event.message === 'downloadOffline') {
    downloadOffline();
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
