
#CachiruloValley.com professional directory

![screenshot](https://github.com/iloire/CachiruloValleyDirectory/raw/master/screenshots/view01.png)

##Check it out!

[directorio.cachirulovalley.com](http://directorio.cachirulovalley.com)

This is professional directory created in express.js and redis. Once you login (linkedin auth), you can create your profile, tag your skills, and recommend other people.

## REDIS DATABASE SCHEMA

    <Project>:user:<id>  (object) => user object in json notation
    <Project>:user:<id>:tags (set) => set of tags for particular user
    <Project>:user:<id>:cats (set) => set of cat id's for particular user
    <Project>:user:linked_id:<id> (int) => PK associated to linkedin id (for faster access)		

    <Project>:cat:<id> (object) => category (id, name, descr)
    <Project>:cats (set) => id's of categories in the database
    <Project>:cat:<id_cat>:users (set) => id's of users associated to a certain category (for faster access)
    <Project>:cats:count (int) => categories count (for assigning autoincremental PK)

    <Project>:tags (set) => tag collection
    <Project>:tags:cat<id_cat> (set) => tags for a certain category
    <Project>:tag:<tag>:users (set) => id's of users associated to a certain tag
	
    <Project>:votes:<id> (set) => set of votes for particular user (each item is the id of the user who voted)

    <Project>:cat:<id_cat>:tag:<tag>:f:<0/1>:e:<0/1>, region (ordered set) => fast access to filter by region, cat, tag, freelance and entrepreneur settings.

##Installation

###Install redis database in your server first

[http://redis.io/download](http://redis.io/download)

###Install dependencies with npm:

    npm install

###Run redis

    redis-server redis.conf

##Tests

There is a test infrastructure built for:

* **Http tests**: test the application "from the outside", with basic http requests.
* **Module tests**: test the library internals.
* **Zombie tests**: test the application with zombie's headless browser (tests ajax, checks DOM, js events, etc).

**Run tests with npm**.

The npm script with launch a new instance of redis database for testing, a new instance of the app, will launch the tests and then shutdown both redis database and app test instances, so no data is touched from the development or production databases.

To run the tests:

    npm test

##Scripts

###Rebuild database:

There is a script used by the test suite in order to create an initial amount of dummy data the tests can run against. The data is populated on the testing database. This database is created on the fly and and deleted after the tests passes.

You can also use the script manually to populate de production/development database:

    node scripts/rebuild_database.js deletealldata

("deletealldata" is a confirmation word, so you don't delete the production database by accident)

## TAGS (change log):

**0.3** 
 
 * Published at [directorio.cachirulovalley.com](http://directorio.cachirulovalley.com)
 * Deep linking through pagination and tag selection
 * Added web site content and about section.

**0.2**

 * Huge performance improvement, load tests (successful load testing with +100.000 users)
 * Sorting
 * Pagination
 * Added twitter recent timeline.
 * Added github own projects sorter by watchers.
 * Styling and other global improvements

**0.1**

 * Added tests (zombie.js based and pure http tests)
 * Added user recomendation feature
 * Improved style
 * Improvements overall

**0.0**

 * Initial work based on previous code : FreelanceDirectory-server + FreelanceDirectory-web

## TODO

 * Keyboard navigation
 * i18n
 * Improve recommendation icons and style.