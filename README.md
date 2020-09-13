# Spider-Task-3
### Webasket:
A shopping cart with buyer and seller handles, created using NodeJS, ExpressJS and MongoDB. The site is hosted **[here](https://webasket.herokuapp.com/).**

### Basic Mode:
##### User Profile: 
- [x] **Login and Register:** Users should be able to register and create accounts. For registration they must provide details like name, email address, password and choose their role (seller or buyer) etc. Users should be able to login using their registered email id and password.
- [x] **Username and Password Validation:** Provide basic validations for password like fixing a minimum length for the password etc. Make sure the email address is unique for each user.
- [x] **Authentication:** The user must be able to access the dashboard only if he/she is logged in.
- [x] **Dashboard:** On logging in, the user must be directed to their respective dashboards based on whether their role is seller or buyer.

##### Customer Interface:
- [x] **Dashboard:** The dashboard must display the recent purchases made by the customer as well as products sorted in any manner you feel necessary.
- [x] **Adding Items to Cart:** Customers should be able to select and add items to their shopping cart. The items in the cart must remain even if the customer has logged out.

##### Seller Interface: 
- [x] **Dashboard:** The seller’s dashboard must display the list of items added by him/her.
- [x] **Handle Storage:** The seller must be able to add new items and update quantity, price, picture, item name, item description etc.
- [x] The quantity of items must be updated automatically as and when a customer makes a purchase.
- [x] The seller must be able to view the list of items purchased by various customers with details like customer name, email id etc. The history of items sold by the seller must be maintained and displayed appropriately.

### Advanced Mode:
##### Customer Interface: 
- [x] **Search Bar:** Customers should be able to search for items available based on item name. 
- [x] **Purchase History:** Maintain the history of purchases made by the customer.

##### Seller Interface:
- [x] **Statistics:** Display the statistics of recent purchases made in a graph. 
