// $Id$

- BUEditor:
A plain textarea editor aiming to facilitate code writing.
The most important feature of this editor is its highly customizable functionality.
It's possible to add image and text buttons whose functions are determined by the user.
Buttons can be customized to generate code snippets, html tags, bbcode tags etc.


- HOW TO INSTALL:
1) Copy editor directory to your modules directory.
2) Enable the module at module administration page.
3) Add/edit editors and buttons at: admin/settings/bueditor.
4) There is the default editor you can use as a starting point.
5) You may install IMCE module to use it as a file/image browser in editor's image & link dialogs.


- EXPORTING AND DELETING BUTTONS:
You should first select the buttons you want to export or delete, using checkboxes next to them.
Then select the action you want to take in the selectbox below the list and press GO.


- ADDING BUTTONS:
You can add buttons to an editor by two methods;
1- Manually entering the values for new button fields located at the bottom of the button list.
2- Importing a CSV file that contains previously exported buttons.


- BUTTON PROPERTIES
TITLE:(required) Title or name of the button. Displayed as a hint on mouse over. A title can be translated
by prefixing it with "t:". Ex: t:Bold turns into t('Bold')
CONTENT: Html or javascript code that is processed when the button is clicked. This can also be
php code that is pre evaluated and return html or javascript code. See BUTTON TYPES.
ICON: Image or text to display the button.
KEY: Accesskey that is supported by some browsers as a shortcut on web pages. With the right
key combinations users can fire the button's click event. Use Alt+KEY in Internet Explorer, and
Shift+Alt+KEY in Firefox.
WEIGHT: Required for sorting the buttons. Line-up is from the lightest to heaviest.


- BUTTON TYPES
There are three types of buttons regarding the CONTENT property;
1- HTML BUTTONS 
2- JAVASCRIPT BUTTONS 
3- PHP BUTTONS


- HTML BUTTONS
These are used for directly inserting plain text or html into the textarea.
It is possible to use the selected text in the textarea by using the place holder %TEXT%
For example, assume that the button content is:
<p>%TEXT%</p>
and it is clicked after selecting the "Hello world!" text in the textarea. Then the result is:
<p>Hello world!</p>
with the selection preserved.
Multiple occurances of %TEXT% is possible and each will be replaced by the selected text. 
These type of buttons are useful for simple html tags or other tag systems like BBCode.
Note: if you want to insert some text containing the phrase %TEXT%, use a javascript button.


- JAVASCRIPT BUTTONS
The content of a javascript button must begin with a 3 charater text "js:" to be differentiated from a
html button. The remaining code is treated as a javascript code and executed in a function when the
button is clicked. These type of buttons are used for special cases where it is insufficient to just replace the 
selected text.
Editor has many ready-to-use methods and variables making it easier to create javascript buttons.
See EDITOR VARIABLES AND METHODS and especially EDITOR INSTANCE variables and methods.


- PHP BUTTONS
The content of a php button must begin with "php:". The remaining code is pre evaluated at the server 
side and expected to return some code. According to the return value of the php code the real type of 
the button is determined. If the php code returns nothing or false, the button is disabled and does not
show up in the editor.
A php button is indeed a html or javascript button. Php execution is for some special purposes. For example,
it is possible to disable or change the content of the button for a specific user role;
Button with content
php: 
if (user_access('access foo')) {
  return 'js: alert("You have the permission to access foo")';
}
turns into a javascript button having the returned content for users having "access foo" permission. for others 
it is disabled and doesnt show up.


- EDITOR VARIABLES
editor:
the top most container variable having other variables and methods in it.

editor.active:
currently active or last used editor istance. When a button is clicked or a textarea is focused, 
the corresponding editor instance becomes the editor.active. If there are multiple editor instances, accesskeys 
are switched to work on the editor.active.
editor.active is widely used in javascript buttons since the methods of the current editor instance are accessed 
using it. Each editor instance has its own variables and methods that can(should) be used by javascript buttons. 
See EDITOR INSTANCE

editor.dialog:
dialog object of the editor used like a pop-up window for getting user input or displaying data.
It has its own variables and methods. See EDITOR DIALOG


- EDITOR METHODS
editor.processTextarea(T):
integrates the editor into the textarea T. This can be used for dynamic editor integration at any time after page load.

editor.openPopup(id, title, content):
opens a pop-up dialog having the given "id", titled as "title" and containing the "content". Returns the js object
representing the pop-up(a html table object).
This pop-up object has its internal "open(title, content, keeppos)" and "close()" methods which can be used for 
further open and close operations. if "keeppos" is set, pop-up opens at previos position, otherwise position is reset.
Since pop-up object is a html table object, it has all the methods and properties of a regular table.
The difference between a pop-up and editor.dialog is that editor.dialog can only have one instance visible at a time,
and it doesnt allow textarea editing when it is open.

editor.createPopup(id, title, content):
This method is used by openPopup method. Creates and returns the pop-up object for further use.(does not open it)


- EDITOR INSTANCE (a must-read for javascript button creators)
Each editor running on the page for a textarea is called an instance. Editor instances have their own variables 
and methods that make it easy to edit textarea content. Active instance on the page can be accessed by the 
variable "editor.active".

Lets assume that we assigned editor.active to a variable E  in our js button's content(actually we dont need this
anymore since the button function is now called with the parameter E).
Here are the VARIABLES of the istance E:

E.textArea: textarea of the instance as an HTML object.
E.buttons: indexed array of buttons of the instance as HTML objects(input objects, type is button or image)
E.bindex: latest/currently clicked button index that can be used in E.buttons. Ex: E.buttons[E.bindex]

Here are the METHODS of the instance E:

E.focus():
Focus on the textarea of the instance.

E.getContent():
Returns the content of the textarea.

E.setContent(text):
Replaces the content of the textarea with the given text.

E.getSelection():
Returns the selected text in the textarea.

E.replaceSelection(text, cursor):
Replace the selected text in the textrea with the given text.
The optinal second argument specifies the position of the caret after replacement.
if cursor='start', it is placed at the begining of the replaced text.
if cursor='end', it is placed at the end of the replaced text.
if cursor is not defined, the selection is preserved containing the replaced text.

E.tagSelection(left, right, cursor):
Encloses the selected text in the textarea with the given left and right texts.
The optional third argument specifies the position of the caret after enclosing.
if cursor='start', it is placed at the begining of the selected text.
if cursor='end', it is placed at the end of the selected text.
if cursor is not defined, the selection is preserved.

E.makeSelection(start, end):
Create a selection by selecting the characters between the indexes "start" and "end".

E.posSelection():
Returns the index values of selection start and selection end.
Returns {start: X, end: Y} where X is the start index and Y is the end index.
Note: No selection is also a selection where start=end=caret position.

E.buttonsDisabled(state, bindex):
Dynamically enable/disable buttons of the instance.
the first argument defines the state of the buttons and should be set to true or false.
the optional second argument defines the index of the button whose state will not change.
Ex: to disable all buttons except the pressed button;
js: E.buttonsDisabled(true, E.bindex);


- EDITOR DIALOG
Editor dialog is an object shared by all editor instances. It can be used to display any kind of data, ie. a html form
to get some user input. 
Here are the methods of editor dialog

editor.dialog.open(title, content):
Opens the dialog with the given title and content in it.

editor.dialog.close():
Closes the dialog.


- EDITOR ICONS
Icons are stored in "icons" folder of the editor. You can put additional icons into this folder to make them visible
in the icon list in the editor edit page.


- EDITOR LIBRARY
While creating a javascript button you may want to use functions or variables from an external javascript library, 
in order to shorten the content text and make it clean. In this case, you should place your javascript library inside 
the "library" folder of the editor. The .js files in this directory will be automatically loaded together with the editor. 
Note that library/...js files are common and are loaded for every editor you define.
In case you want a library file to be loaded for only a specific editor, you should create a sub-folder under library 
directory, which has the same name as the editor. For example, library/editorFoo/...js files will only be loaded 
for the editor having the name "editorFoo".


- EDITOR TEMP DIRECTORY
After starting to use the editor, you might notice that an extra folder named as bueditor in system file directory is 
created. This directory is used to store javascript files that contain buttons of your editors. Including them in a file 
instead of including them inline, allows browser caching and reduces page load time.
Since buttons may have php code that makes them change dynamically, md5 is used to track the changes in buttons 
script. If there is a matching file in the folder, it is loaded. Otherwise, a new file is created and loaded. If file loading 
fails, buttons are included as inline script.
Note: Files older than 15 days are cleaned in each cron run.
If download method is PRIVATE, buttons are always included inline.


- KNOWN ISSUES
Accesskeys in Internet Explorer:
Pressing an accesskey(Alt+KEY) when there is a selection, deselects it with preserving the caret position.

Accesskeys in Firefox:
If there are multiple editors in the page, accesskeys(Shift+Alt+KEY) will work on only the first editor instance. 
This is becouse FF does not allow dynamic adjustment of accesskeys.

New line character:
Since new line is represented by different characters (\r, \r\n, \n) on different platforms, there may be some 
unexpected behaviour of the editor in some platform-browser combos regarding the cursor position after text 
insertion/replacement. Specify new line characters as "\n", if you have to use any in your scripts.


- DEFAULT BUTTONS
BUEditor comes with a few default buttons that may help you extend the editor:

Insert/edit image:
Inserts image html after getting the src, width, height, alt attributes from the user. If IMCE module is installed, 
and the user has access to it, a Browse button will appear linking to IMCE image browser.
Editing a previously inserted image is possible if the html code of the image is selected with no extra characters.

Insert/edit link:
Inserts link html after getting the href, title attributes from the user. If IMCE module is installed, and the user has 
access to it, a Browse button will appear linking to IMCE file browser.
Editing a previously inserted link is possible if the html code of the link is selected with no extra characters.

Bold:
Encloses the selected text with the tag <strong>

Italic:
Encloses the selected text with the tag <em>

Ordered list:
Converts the lines in the selected text to a numbered list. It is also possible to start a new list with no selection. 
If the selection is an ordered list which was previosly created by this button, the lines in the text are restored.

Unordered list:
Converts the lines in the selected text to a bulleted list. It is also possible to start a new list with no selection. 
If the selection is an unordered list which was previosly created by this button, the lines in the text are restored.

Teaser break:
Inserts Drupal teaser break which is <!--break-->

Preview:
Previews the textarea content. By default, lines and paragraphs break automatically. Set first argument to true to preview pure html. Set second argument to true to preview only the selected text:
eDefPreview(true);//no conversion of new lines. preview is based on pure HTML.
eDefPreview(false, true);//only the selection is previewed.

Help:
Displays the title(hint) for each button in the editor.


- TIPS AND TRICKS

How to disable a button temporarily?
Make the first line of the button content:
php: return;/*
and the last line:
*/

How to extend image or link dialogs to get values for other attributes of "img" and "a" tags from the user?
How to create a dialog for any tag just like image or link dialogs?

There is the eDefTagDialog(tag, fields, dtitle, stitle, func) function in default buttons library to create a dialog for
any tag. 
tag -> tag name
fields -> an array of attributes that are eiter strings or objects.
dtitle -> dialog title. if not specified, "(tag) Tag Dialog" is used.
stitle -> laber for submit button. if not specified, browser decides on it.
func -> name of the function that will be executed after submission instead of the default one. (for advanced use)

The simplest form, for example:
eDefTagDialog('div', ['id', 'class', 'style']);
will create a DIV Tag Dialog requesting values of attributes id, class and style. It will also detect if the selection
is a proper DIV tag, and if so, will put the values of attributes to the corresponding fields. After submission, it will
enclose/replace the selection in textarea.

You might have noticed that fields in image/link dialogs are declared as objects not asstrings. That's a
customized form of declaring attributes. It is ideal to use an object if you want
- a field type other than textfield (type: 'select', options: {'left': 'Left', 'right': 'Right'}) - only select is supported.
- a custom label (title: 'Image URL')
- a default value (value: ' ')
- some prefix or suffix text or html (prefix: '[ ', suffix: ' ]')
- to join two fields in a single line like in image width & height fields (getnext: true)
- to set custom attributes for the field (attributes: {size: 10, style: 'width: 200px'})
The field object must have a name property that specifies the attribute name. {name: 'href'}

So lets add an "align" attribute field to the image dialog(note that it's not XHTML compliant):

The field object to pass to eDefTagDialog is;
{
  name: 'align',//required
  title: 'Image align', // if we dont set it, it will be set as 'Align' automatically.(name whose first letter is uppercase)
  type: 'select', // we use a selectbox instead of a plain textfield.
  options: {'': '', left: 'Left', right: 'Right', center: 'Center'} // set options in the form-> {attribute-value: 'Visible value'}
}

Lets add it to the form in the image button's content:

var form = [
 {name: 'src', title: 'Image URL'},
 {name: 'width', title: 'Width x Height', suffix: ' x ', getnext: true, attributes: {size: 3}},
 {name: 'height', attributes: {size: 3}},
 {name: 'alt', title: 'Alternative text'},
 {name: 'align', title: 'Image align', type: 'select', options: {'': '', left: 'Left', right: 'Right', center: 'Center'}} //align
];
eDefTagDialog('img', form, 'Insert/edit image', 'OK');

That's it. We now have an image dialog which can also get/set the "align" attribute of an image tag.


How to create a button that gets user input and adds it to the textarea?
Button content should be like this:
js:
// function that inserts the user input from the form into the textarea.
editor.getUserInput = function(form) {
  editor.active.replaceSelection('User input is: '+ form.elements["user_input"].value);
  editor.dialog.close();//close the dialog when done.
}
//form html. we define an input field named as "user_input".
var userForm = '<form onsubmit="editor.getUserInput(this); return false;">';//run getUserInput on submission
userForm += 'Input : <input type="text" name="user_input" />';
userForm += '<input type="submit" value="Submit" /></form>';
//open editor dialog with a title and the user form.
editor.dialog.open('User Input', userForm);

This example uses a form which is more suitable for complex user input. If you want to get just a single input you 
may consider using javascript prompt(). Here is an example that gets image URL as a user input
js:
var url = prompt('URL', '');//prompt for URL
var code = '<img src="'+ url +'" />';//put the url into the code.
editor.active.replaceSelection(code);//replace the selection with the code.


How to create a button to insert XHTML-compatible Underlined text?
Since <u> is not XHTML-compatible, you should use CSS. First of all, you need to define a class in your theme's 
CSS file, for instance; 
.underlined-text {text-decoration: underline;}
As the above class exists, you can use it in your button content:

<span class="underlined-text">%TEXT%</span>

Where %TEXT% will be replaced by the selected text in the textarea.