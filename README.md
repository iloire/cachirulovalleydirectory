
#CachiruloValley.com professional directory

![screenshot](https://github.com/iloire/CachiruloValleyDirectory/raw/master/screenshots/view01.png)

##Check it out!

[directorio.cachirulovalley.com](http://directorio.cachirulovalley.com)

This is **professional directory** created in express.js and redis. Once you login (linkedin auth), you can create your profile, tag your skills, and recommend other people.

## Note

This app was developed in early 2012, and it has not been updated or maintained, which means this is some sort of JS prehistory, so proceed at your own risk.

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

The application has been **successfully tested with more than 100K users**.

##Installation

###Install redis database in your server first

[http://redis.io/download](http://redis.io/download)

###Install dependencies with npm:

    npm install -d

###Run redis

    redis-server redis.conf

###Configure your env

```js
export LINKEDIN_API_KEY='YOUR-KEY'
export LINKEDIN_SECRET_KEY='YOUR-SECRET'
export CACHIRULO_DIRECTORIO_BASE_URL='http://directorio.cachirulovalley.com'
```

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

**0.0.6**
 
 * Use gravatar instead of linkedin avatars because the image URL gets broken once the user changes its linkedin profile image.
 * Make package.json version fixed. Fix some other things on package.json that were pretty broken.
 * Improvements to package.json scripts (now it is easier to start/stop the server).

**0.0.5**
 
 * Added gzip compression using gzippo module.
 * Compress JS assets with uglifyjs.
 * Upgraded jquery.timeago to 0.11.1
 * Project cleaning and refactoring.
 * Filter tags by a those who contain a minimum of ocurrences (defined on config file).

**0.0.4**

 * Make recommendation default sorting method
 * User friendly urls for profile names.

**0.0.3** 
 
 * Published at [directorio.cachirulovalley.com](http://directorio.cachirulovalley.com)
 * Deep linking through pagination and tag selection
 * Added web site content and about section.

**0.0.2**

 * Huge performance improvement, load tests (successful load testing with +100.000 users)
 * Sorting
 * Pagination
 * Added twitter recent timeline.
 * Added github own projects sorter by watchers.
 * Styling and other global improvements

**0.0.1**

 * Added tests (zombie.js based and pure http tests)
 * Added user recomendation feature
 * Improved style
 * Improvements overall
 * Initial work based on previous code : FreelanceDirectory-server + FreelanceDirectory-web

## TODO

 * Upgrade to a more recent version of Node, and Express... and everything else :)
 * Static content compression/minification
 * Keyboard navigation
 * i18n
 * Improve recommendation icons and style.

##Contributions

 * [Fernando Val - @aaromnido](http://www.twitter.com/aaromnido) : Web site design
 * [CachiruloValley team](http://www.cachirulovalley.com): Brainstorming, feedback, support. Cachirulo Valley are:
 
    * [Pablo Jimeno - @pablojimeno](http://www.twitter.com/pablojimeno)
    * [Alberto Gimeno - @gimenete](http://www.twitter.com/gimenete)
    * [Dani Latorre - @dani_latorre](http://www.twitter.com/dani_latorre)
    * [Guillermo Latorre - @superwillyfoc](http://www.twitter.com/superwillyfoc)
	* [Fernando Val - @aaromnido](http://www.twitter.com/aaromnido)
	* [Ivan Loire - @ivanloire](http://www.twitter.com/ivanloire)

##LICENSE

Copyright (c) 2011 Iván Loire Mallén - [www.iloire.com](http://www.iloire.com) (twitter [@ivanloire](http://www.twitter.com/ivanloire))

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
