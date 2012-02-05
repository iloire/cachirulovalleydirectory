
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
	<Project>:categories_count  (int) => categories count (for assigning autoincremental PK)

	<Project>:tags (set) => tag collection
	<Project>:tags:cat<id_cat> (set) => tags for a certain category
	<Project>:tag:<tag>:users (set) => id's of users associated to a certain tag
	
	<Project>:votes:<id> (set) => set of votes for particular user (each item is the id of the user who voted)

	<Project>:users:region:<region> (set) => users from region X
	<Project>:users:freelance:<freelance> (set) => users by freelance field value
	<Project>:users:entrepreneur:<entrepreneur> (set) => users by entrepreneur field value	

	<Project>:cat:<id_cat>:tag:<tag>:freelance:<0/1>:entrepreneur:<0/1>, region (ordered set) => fast access to filter by region, cat, tag, freelance and entrepreneur settings.

## TAGS (change log):

**0.2**

 * Added twitter recent timeline.
 * Added github own projects sorter by watchers.
 * Global improvements

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
 * List ordering
 * List pagination