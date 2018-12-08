let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoicGlwNHBhcCIsImEiOiJjamtpM2d2ejAwa2tlM3FwMHVtZ2h1MHYwIn0.RC-L3uuXdW19uannyWF6lg',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      if(!self.restaurant.reviews){
        restaurant.reviews = DBHelper.getReviews(self.restaurant.id, (error, reviews) =>{
          if(!error){
            self.restaurant.reviews = reviews;
            removeReviewsHTML();
            fillReviewsHTML();
          }
        });
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} restaurant promotion banner`;
   
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  const FavButton = DBHelper.favoriteIcon(restaurant);
  FavButton.classList.add('favorite-heart');
  const primaryFavButton = document.getElementById('favorite-button');
  primaryFavButton.parentNode.replaceChild(FavButton, primaryFavButton);


  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  DBHelper.getPendingReviews((error, reviews) => {
    reviews.forEach((review) => {
      DBHelper.postRestaurantReview(review, (error, response) => {
        if(error){
          console.log('fillReviewsHTML ' + error);
        }
        displayRecentlyWrittenReview(response);
      });
    });
  });

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

const removeReviewsHTML = () => {
  const list = document.getElementById('reviews-list');
  list.innerHTML = "";
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  if(review.createdAt){
    const date = document.createElement('p');
    date.innerHTML = `Posted: ${new Date(review.createdAt).toDateString()}`;
    date.classList.add('review-date');
    li.appendChild(date);
  }

  if(review.updatedAt && review.updatedAt !== review.createdAt){
    const updatedDate = document.createElement('p');
    updatedDate.innerHTML = `Updated: ${new Date(review.updatedAt).toDateString()}`;
    date.classList.add('review-date');
    li.appendChild(date);
  }

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const submitReview = (form) => {
  const reviewLabel = form.elements.namedItem('review-label');
  const reviewRating = form.elements.namedItem('review-rating');
  const reviewComments = form.elements.namedItem('review-comments');
  const restaurantID = self.restaurant.id;

  if (!(reviewLabel && reviewRating && reviewComments)) {
    return false;
  }
  const reviewDiv = document.getElementById('review-submission');
  reviewDiv.style.display = 'none';
  
  const loader = document.createElement('div');
  loader.classList.add('loader');
  loader.id = ('review-loader');
  document.getElementById('review-submission-container').append(loader);

  const postData = {
    'restaurant_id': restaurantID,
    'name': reviewLabel.value,
    'rating': reviewRating.value,
    'comments': reviewComments.value
  }

  DBHelper.postRestaurantReview(postData, (error, response) => {
    if (error) {
      hideLoader();
      displayReviewSubmissionError(error);
      return false;
    }
    hideLoader();
    displayReviewSubmissionSuccess();
    displayRecentlySubmittedReview(response);
  });
  return false;
}

const displayConfirmationModal = (options) => {

  const reviewModal = document.createElement('div');
  reviewModal.classList.add('review-modal');
  reviewModal.id = 'review-modal';
// Modal tittle
  if (options.title) {
    const modalTitle = document.createElement('h3');
    modalTitle.innerHTML = options.title;
    modalTitle.classList.add('review-modal-title');
    reviewModal.append(modalTitle);
  }
// Modal details
  if (options.details) {
    const modalDetails = document.createElement('p');
    modalDetails.innerHTML = options.details;
    modalDetails.classList.add('review-modal-details');
    reviewModal.append(modalDetails);
  }
  // Modal Ok Button
  const modalConfirm = document.createElement('button');
  modalConfirm.innerHTML = 'Ok';
  modalConfirm.classList.add('review-modal-button');
  modalConfirm.addEventListener('click', () => {
    const reviewModal = document.getElementById('review-modal');
    reviewModal.parentNode.removeChild(reviewModal);
  });
  reviewModal.append(modalConfirm);

  // Add it all to review section
  document.getElementById('review-submission-container').append(reviewModal);
}

const displayReviewSubmissionSuccess = () => {
  const modalData = {
    title: 'Success',
    details: 'Your review has been submitted successfully.'
  }
  displayConfirmationModal(modalData);
}

const displayReviewSubmissionError = (error) => {
  const modalData = {
    title: 'Error',
    details: 'Your review will be submitted when the internet connection returns'
  }
  displayConfirmationModal(modalData);
}

const displayRecentlySubmittedReview = (reviewData) => {
  const reviewsList = document.getElementById('reviews-list');
  const newReview = createReviewHTML(reviewData);
  newReview.style.backgroundColor = '#FFFFCC';
  reviewsList.insertBefore(newReview, reviewsList.childNodes[0]);
}

const hideLoader = () => {
  const reviewLoader = document.getElementById('review-loader');
  if(reviewLoader){
    reviewLoader.parentNode.removeChild(reviewLoader);
    document.getElementById('review-label').value = '';
    document.getElementById('review-rating').value = '';
    document.getElementById('review-comments').value = '';
    document.getElementById('review-submission').style.display = 'block';
    return true;
  }
  return false;
}