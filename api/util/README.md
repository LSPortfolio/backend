# Utilities Folder
---
This utilities folder consists of all the tools we expect to be able to use throughout the backend. Just import this index.js file (the folder), or deconstruct the specific utilities you will need into your file.
----
### Helper functions:

* **emailUser**: Function that returns a promise. Used by one of the exported functions to send out all of the emails. To be used only here in the utilities folder by the sendEmail object. It takes the following parameters:
	* **type**: The type of email we plan on sending. Find all email types in the file email.js. Each email type is an object that contains the following keys (subject, html). Find out more in email.md
	* **to**: The email address you plan on sending this email to.
	* **subject**: (Optional String), please only include this in a custom style email.
	* **body**: (Optional String), please only use this in a custom style email.
`return emailUser(emails.welcome, 'john@email.com')`
----
### Exported Functions & Objects:

* **handleErr**: THE defacto error handler. To be used throughout the application. It takes four parameters:
	* **res**: This error handler is expected to be able to handle the response in the express app. So the first parameter is to pass in the ‘res’ object
	* **status**: A number. This number is the http response code for the error. Please look through [List of HTTP status codes - Wikipedia](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)  to decide which is the best code for the error you’re addressing. IF IT IS A SERVER ERROR (500), You don’t have to include a message or data.
	* **message**: (Optional) A user friendly message as a string to be returned to the user who just experienced the error.
	* **data**: (Optional) Pass the actual data of the error you received in here for logging
For a server error: `if (err) return handleErr(res, 500);`
For any other error: `if (err) return handleErr(res, 403, 'You are not authorized to access this data', err);`
* **isLoggedIn:** Middleware. To be passed to the routers before calling the controllers. This just checks the request to see if it contains a token in either the body as body.token, the query as query.token, or the headers as headers[‘x-access-token’]. It decodes the token using the server’s secret and adds the decoded token to the request and then calls next(). If the token doesn’t exist, or the token cannot be decoded, it sends back an unauthorized error as the response to the client.
**Use**: `router.post('/updateAccount', isLoggedIn, controller.updateAccount);`
* **isAdmin**: Middleware. To be passed to the routers after calling **isLoggedIn** and before calling the controllers. This one checks the returned decoded token from **isLoggedIn** to ensure that the person is an admin with permission to access this route. It returns an error to the client if the person is not allowed.
**Use**: `router.post('/updateAPerson', isLoggedIn, isAdmin, controller.updatePerson);`
* sendEmail: An object with multiple sending methods for the different types of emails to send. There are currently several different types of emails to be sent, based on the emails.js file:
	* welcome
	* forgotPassword
	* pwResetSuccess
	* notify_project_like
	* notify_project_comment
```
const { sendEmail } = require('../util');
...
sendEmail.welcome('john@email.com')
	.then(success => somethingelse)
	.catch(err => handleErr(res, 503, 'Could not send email'));
... 
sendEmail.forgotPassword('john@email.com', tokenVariable)
	.then(success => somethingelse)
	.catch(err => handleErr(res, 503, 'Could not send email'));
```
---
## emails.js

This is a file that has all the content for the emails we intend to send out to people using the SendGrid API. This file exports out an object, and each key is an email ‘type’ used in the `emailUser(type, to, subject, body)` function above.

Please be sure that the emails in here are user/client friendly. Here are some great resources for how to write some really nice emails for users: 
* [Really Good Emails - The Best Email Designs in the Universe (that came into my inbox)](https://reallygoodemails.com/)
* [Good Copy • Email copy from great companies](http://www.goodemailcopy.com/)

The following email types are currently in the file, but should be expanded on. Also, you’re free to add to this list whenever the need arises.
* **Welcome**: Sent to users when they join the website. The welcome.html should be a function that returns html based on what type of account the user has (user, student, staff) and their permissions.
* **resetPassword**: Sent to users who cannot remember their passwords. The controller should create a token for them, pass that token to ‘sendEmail’ function and make the ‘resetPassword.html’ be a function that returns text, plus a clickable link with the token for the client side to use.
* **pwResetSuccess**: Sent to users who have successfully changed their password. Just to let them know that they now have a new password.
* **notify_project_like**: An email notification sent to users to let them know that somebody has liked a project that they submitted on the website.
* **notify_project_comment**: An email notification sent to users to let them know that somebody has left a comment on their project. If you want, we can also include the comment in the email body.
* **TODO:**
	* **notify_project_submitted**
	* **notify_resume_viewed**: (MAYBE, thought: we can make it so that people who are logged in can view other people’s resumes. When that happens we let them know that the logged in person has viewed their resume.)