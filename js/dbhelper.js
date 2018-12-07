  /**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return 'http://localhost:1337/restaurants';
  }

  //Populate IDB with restaurant json
  /******************Create Indexed DB******************/
  static openIDB() {
    if(!'serviceWorker' in navigator){
      return Promise.resolve();
    }
    const dbPromise = idb.open('restaurantDB', 1, upgradeDB => {
      switch(upgradeDB.oldVersion){
        case 0:
          const restaurants = upgradeDB.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        case 1:
          const offlineFavorites = upgradeDB.createObjectStore('offline-favorites', {
            keyPath: 'id'
          });
      }
    });
    return dbPromise;
  }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.openIDB().then(db => {
      const restaurantStore = db.transaction(['restaurants']).objectStore('restaurants');
      restaurantStore.getAll().then(data => {      
        if(data.length > 0){
          callback(null, data);
        }
        else{
          fetch(DBHelper.DATABASE_URL)
            .then(res => {
              return res.json();
            })
            .then(json => {
              json.forEach(element => {
                DBHelper.openIDB().then(db => {
                  const tx = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
                  tx.put(element);
                });
                callback(null, json);
              });
            })
            .catch(error => callback(`The request failed. Status: ${error.statusText}`, null));
        }
      });
    });
    
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
   DBHelper.openIDB().then(db => {
    const restaurantStore = db.transaction(['restaurants']).objectStore('restaurants');
    restaurantStore.get(parseInt(id)).then(data =>{
      if (data) {
        callback(null, data);
      } else {
        DBHelper.fetchRestaurantAddToIDB(id, callback);
      }
    });
   });
  }

  static fetchRestaurantAddToIDB(id, callback){
    fetch(`${DBHelper.DATABASE_URL}/${id}`)
    .then(res => {
      return response.json();
    })
    .then(json => {
      DBHelper.openIDB().then(db => {
        const tx = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
        tx.put(json);
      });
      callback(null, json);
    })
    .catch(error => {
      callback(`The request failed. Status: ${error.statusText}`, null);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }

  static amendFavorite(restaurant){
    DBHelper.openIDB().then(db => {
      let store = db.transaction(['restaurants'], 'readwrite')
      .objectStore('restaurants');
      store.put(restaurant);
    });
  }
  static pendingFavorite(id, callback){
    DBHelper.openIDB().then(db => {
      const store = db.transaction(['offline-favorites'], 'readwrite')
      .objectStore('offline-favorites');
      store.get(id)
      .then(data => {
        if(data){
          store.delete(id);
          callback(null, data);
        } else {
          callback(null, null);
        }
      })
      .catch(error => {
        callback(error, null);
      })
    });
  }
  static toggleFavorite(restaurant, callback) {
    const url = `${DBHelper.DATABASE_URL}/${restaurant.id}/?${restaurant.madeFavorite === 'true' ? 'madeFavorite=false' : 'madeFavorite=true'}`
    fetch(url, {method: 'PUT'})
    .then(response => response.json())
    .then(json => {
      DBHelper.amendFavorite(json);
      callback(null, json);
    })
    .catch(error => {
      DBHelper.openIDB().then(db => {
        const tx = db.transaction(['offline-favorites'], 'readwrite');
        const store = tx.objectStore('offline-favorites');
        store.get(restaurant.id).then(data => {
          if (data) {
            store.delete(restaurant.id);
          } else {
            store.put({
              id: restaurant.id,
              favorite: (restaurant.madeFavorite === 'true') ? true : false
            });
          }
        });
      });
      callback(error, null);
    });
  }
  static favoriteIcon(restaurant){
    const favorite = document.createElement('button');
    favorite.classList.add('favIcon');
    if (restaurant.madeFavorite === 'true') {
      favorite.innerHTML = '&#x2764;'
      favorite.setAttribute('aria-label', `Remove ${restaurant.name} from favorite restaurants`);
      favorite.classList.add('clickedIcon');    
    } else {
      favorite.innerHTML = '&#x2764';
      favorite.setAttribute('aria-label', `Add ${restaurant.name} to favorite restaurants`);
      favorite.classList.remove('clickedIcon');
    }

    DBHelper.pendingFavorite(restaurant.id, (error, favorite) => {
      if (error) {
        console.error(error);
      } else if (favorite){
        DBHelper.toggleFavorite(favorite, (error, response) => {
          if (error) {
            console.error(error);
          } else {
            console.log(response);
          }
        });
      }
    });

    favorite.setAttribute('role', 'button');
    favorite.addEventListener('click', (event) => {
      DBHelper.toggleFavorite(restaurant, (error, response) => {
        if (error) {
          console.error(error);
        } else {
          restaurant.madeFavorite = response.madeFavorite;
          if (response.madeFavorite === 'true') {
            favorite.innerHTML = '&#x2764;'
            favorite.setAttribute('aria-label', `Remove ${restaurant.name} from favorite restaurants`);
            favorite.classList.add('clickedIcon');    
          } else {
            favorite.innerHTML = '&#x2764;'
            favorite.setAttribute('aria-label', `Add ${restaurant.name} to favorite restaurants`);
            favorite.classList.remove('clickedIcon');
          }
        }
      });
    });
    return favorite;
  }
}