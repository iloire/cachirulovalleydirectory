
#CachiruloValley.com professional directory

![screenshot](https://github.com/iloire/CachiruloValleyDirectory/raw/master/screenshots/view01.png)

This is professional directory created in express.js and redis. Once you login (linkedin auth), you can create your profile, tag your skills, and recommend other people.

## REDIS DATABASE STRUCTURE

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

## TAGS (change log):

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
 * Improve recomendation icons and style.