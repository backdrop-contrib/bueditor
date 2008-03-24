// $Id$

- BUEditor:
A plain textarea editor aiming to facilitate code writing.
It's the most customizable text editor of the web because it allows you to;
 - build the editor from scratch.
 - determine the functionality by defining image or text buttons that generate code snippets, html tags, bbcode tags etc.
 - determine the design and layout by defining theme buttons that insert html to the layout.


- WHAT'S NEW IN 6.x:
 - custom icon and library paths for each editor.
 - support using different editor templates for differnet textareas in a page.
 - alternative editor assignment for user roles.
 - theme buttons that provide unlimited theming options.
 - Headers (h1, h2, h3, h4) button and separators in default editor.
 - changed key variable from "editor" to "BUE". (ex: editor.active is now BUE.active)
 - another popup dialog(BUE.quickPop) that has no title or close button.
 - jquery effects. (ex: effects in popup openings)
 In default buttons' library:
 - new eDefTagChooser function that uses BUE.quickPop to allow users choose among predefined tags.
 - new eDefTagger function that toggles(inserts or removes) a predefined tag in the selection.
 - eDefTagDialog accepts a special attribute name, "html", that represents the inner html of the tag.
 - eDefTagDialog accepts "textarea" as a field type.


- HOW TO INSTALL:
1) Copy editor directory to your modules directory.
2) Enable the module at module administration page.
3) Add/edit editors and buttons at: admin/settings/bueditor.
4) There is the default editor you can use as a starting point.
5) You may install IMCE module to use it as a file/image browser in editor's image & link dialogs.
6) Make sure your input format does not filter the tags the editor inserts.


- ADDING BUTTONS:
You can add buttons to an editor by two methods;
1- Manually entering the values for new button fields located at the bottom of the button list.
2- Importing a CSV file that contains previously exported buttons.


- EXPORTING AND DELETING BUTTONS:
You should first select the buttons you want to export or delete, using checkboxes next to them.
Then select the action you want to take in the selectbox below the list and press GO.


- BUTTON PROPERTIES

TITLE:(required) Title or name of the button. Displayed as a hint on mouse over.
A title can be translated by prefixing it with "t:". Ex: t:Bold turns into t('Bold').
If the title starts with "tpl:", the button is considered a theme button. See BUTTON TYPES

CONTENT: Html or javascript code that is processed when the button is clicked. This can also be
php code that is pre evaluated and return html or javascript code. See BUTTON TYPES.

ICON: Image or text to display the button.

KEY: Accesskey that is supported by most browsers as a shortcut on web pages. With the right
key combinations users can fire the button's click event. Use Alt+KEY in Internet Explorer, and
Shift+Alt+KEY in Firefox.

WEIGHT: Required for sorting the buttons. Line-up is from the lightest to the heaviest.


- BUTTON TYPES
There are three types of buttons regarding the CONTENT property;
1- HTML BUTTONS 
2- JAVASCRIPT BUTTONS 
3- PHP BUTTONS
4- THEME BUTTONS


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
These type of buttons are used for special cases where it is insufficient to just replace the selected text.
The content of a javascript button must begin with a 3 charater text "js:" to be differentiated from a
html button. The remaining code is treated as a javascript code and executed in a function when the
button is clicked. The function is called with the parameter E which represents the active editor. 
Editor has many ready-to-use methods and variables making it easy to create javascript buttons.
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


- THEME BUTTONS
A theme button is a special type of button that just inserts html into editor interface for theming purposes. It can be
used to insert separators, line breaks or any html code in order to achieve the themed editor interface. For a button to
be considered as a theme button it should have a title starting with "tpl:". Having this title, the button is processed to
insert a piece of html code that is included in button content and button icon(or caption). A theme button, regarding its 
content, can also be a js or php button at the same time.

In order to determine what the button inserts into the layout;
 - first, content is checked and 
    - if it is javascript code(js:) it is executed and the value that returned is inserted into the layout
    - otherwise it is inserted as it is.
 - then, icon or caption is checked and inserted as being wrapped in "<span class="separator"></span>".

Here are some examples;

[title: "tpl:", content: "<br />", caption: ""]
Inserts <br />.(line break)

[title: "tpl:", content: "<br />", icon: "separator.png"]
Inserts <br /><span class="separator"><img src="path-to-sparator.png"></span>.

[title: "tpl:", content: "", caption: "|"] OR [title: "tpl:", content: "<span class="separator">|</span>"]
Inserts <span class="separator">|</span>.

[title: "tpl:", content: "js: return new Date()"]
Inserts new date returned from javascript.

You can also create groups of buttons by creating wrappers around them;

[title: "tpl:", content: "<div class="group1">"] (Start wrapping by opening a div)
[...buttons of the group in between(can be both theme buttons and functional buttons)]
[title: "tpl:", content: "</div>"] (End wrapping by closing the div)


- EDITOR VARIABLES
BUE:
the top most container variable having other variables and methods in it.

BUE.templates
container for editor templates(configurations, buttons and interface)

BUE.instances
array containing the editor instances in the page

BUE.active:
currently active or last used editor istance. When a button is clicked or a textarea is focused, 
the corresponding editor instance becomes the BUE.active. If there are multiple editor instances, accesskeys 
are switched to work on the BUE.active.
BUE.active is widely used in javascript buttons since the methods of the current editor instance are accessed 
using it. Each editor instance has its own variables and methods that can(should) be used by javascript buttons. 
See EDITOR INSTANCE

BUE.dialog:
dialog object of the editor used like a pop-up window for getting user input or displaying data.
It has its own variables and methods. See EDITOR DIALOG

BUE.quickPop:
another dialog object of the editor. It has no title or close button.
It has its own variables and methods. See EDITOR QUICK-POP


- EDITOR METHODS
BUE.processTextarea(T, tplid):
integrates the editor template(BUE.templates[tplid]) into the textarea T.
This can be used for dynamic editor integration at any time after page load.

BUE.openPopup(id, title, content, effect):
Opens a pop-up dialog having the given "id", titled as "title" and containing the "content".
Returns the js object representing the pop-up(a html table object).
This pop-up object has its internal "open(title, content, effect)" and "close(effect)" methods which can be used for 
further opening and closing operations.
Since pop-up object is a html table object, it has all the methods and properties of a regular table.
The difference between a pop-up and editor.dialog is that editor.dialog can only have one instance visible at a time,
and it doesnt allow textarea editing when it is open.
optional effect parameter is one of the jQuery effects (opening: 'slideDown', 'fadeIn', closing: 'slideUp', 'fadeOut')

BUE.createPopup(id, title, content):
This method is used by openPopup method. Creates and returns the pop-up object for further use.(does not open it)


- EDITOR INSTANCE (a must-read for javascript button creators)
Each editor running on the page for a textarea is called an instance. Editor instances have their own variables 
and methods that make it easy to edit textarea content. Active instance on the page can be accessed by the 
variable "BUE.active".

A js button script is executed in a function with the argument E that refers to BUE.active.
Here are the VARIABLES of the istance E:

E.index: index of the instance in the array BUE.instances
E.textArea: textarea of the instance as an HTML object.
E.tpl: editor template that this instance uses.(one of BUE.templates)
E.UI: html object that wraps the instance interface. (<div class="editor-container" id="editor-%index"></div>)
E.buttons: array of buttons of the instance as HTML objects(input objects: type is button or image)
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

BUE.dialog.open(title, content, effect):
Opens the dialog with the given title and content in it.
optional effect parameter is one of the jQuery effects ('slideDown' or 'fadeIn')

BUE.dialog.close(effect):
Closes the dialog.
optional effect parameter is one of the jQuery effects ('slideUp' or 'fadeOut')


- EDITOR QUICK-POP
This is a pop-up object without a title and a close button. It shows just the content and closes automatically
when the user clicks somewhere in the document.
To open a quick-pop:

BUE.quickPop.open(content, effect):
Opens the quick-pop with the content in it.
optional effect parameter is one of the jQuery effects ('slideDown' or 'fadeIn')


- EDITOR ICONS
All images with jpg, gif or png extensions in the editor's icon path (which is bueditor_path/icons by default) are accessible
by the editor and listed in the icon list in the editor editing page.


- EDITOR LIBRARY
While creating a javascript button you may want to use functions or variables from an external javascript library 
in order to shorten the content text and make it clean. The editor library path is the place where you should put 
your javascript files to be loaded with the editor. The default path is bueditor_path/library.


- KNOWN ISSUES
Accesskeys in Internet Explorer:
Pressing an accesskey(Alt+KEY) when there is a selection, deselects it preserving the caret position.

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
Inserts link html after getting the link URL, link text and title from the user. If IMCE module is installed, and the user has 
access to it, a Browse button will appear linking to IMCE file browser.
Editing a previously inserted link is possible if the html code of the link is selected with no extra characters.

Bold:
Encloses the selected text with the tag <strong>

Italic:
Encloses the selected text with the tag <em>

Headers:
Pops a dialog showing h1, h2, h2, h4 header tags to choose among.

Ordered list:
Converts the lines in the selected text to a numbered list. It is also possible to start a new list with no selection. 
If the selection is an ordered list which was previosly created by this button, the lines in the text are restored.

Unordered list:
Converts the lines in the selected text to a bulleted list. It is also possible to start a new list with no selection. 
If the selection is an unordered list which was previosly created by this button, the lines in the text are restored.

Teaser break:
Inserts Drupal teaser break which is <!--break-->

Preview:
Previews the textarea content. By default, lines and paragraphs break automatically.
eDefPreview function accept 2 parameter.
Set first parameter to true to preview pure html. Set second parameter to true to preview only the selected text:
eDefPreview(true);//no automatic line breaking. preview is based on pure HTML.
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
stitle -> laber for submit button. if not specified, browser's default is used.
func -> name of the function that will be executed after submission instead of the default one. (for advanced use)

The simplest form, for example:
eDefTagDialog('div', ['id', 'class', 'style', 'html']);//html is a special keyword that represents inner html
will create a DIV Tag Dialog requesting values of attributes id, class and style and also the inner html.
It will also detect if the selection is a proper DIV tag, and if so, will put the values of attributes to the corresponding fields.
After submission, it will enclose/replace the selection in textarea.

You might have noticed that fields in image/link dialogs are declared as objects not as strings. That's a
customized form of declaring attributes. It is ideal to use an object if you want
- a field type other than textfield (type: 'select', options: {'left': 'Left', 'right': 'Right'})
  textarea and select are the two options other than the default.
- a custom label (title: 'Image URL')
- a default value (value: ' ')
- some prefix or suffix text or html (prefix: '[ ', suffix: ' ]')
- to join two fields in a single line like in image width & height fields (getnext: true)
- to set custom attributes for the field (attributes: {size: 10, style: 'width: 200px'})

Note:
- The field object must have a name property that specifies the attribute name. ex:{name: 'href'}
- If a field value has new line character(\n) in it, then the field type automatically becomes "textarea"

So lets add an "align" attribute field to the image dialog(note that it's not XHTML compliant):

The field object to pass to eDefTagDialog is;
{
  name: 'align',//required
  title: 'Image align', // if we dont set it, it will be set as 'Align' automatically.(the name with the first letter uppercase)
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

Button content could be like this:
js:
// function that inserts the user input from the form into the textarea.
BUE.getUserInput = function(form) {
  E.replaceSelection('User input is: '+ form.elements["user_input"].value);
  BUE.dialog.close();//close the dialog when done.
}
//form html. we define an input field named as "user_input".
var userForm = '<form onsubmit="editor.getUserInput(this); return false;">';//run getUserInput on submission
userForm += 'Input : <input type="text" name="user_input" />';
userForm += '<input type="submit" value="Submit" /></form>';
//open editor dialog with a title and the user form.
BUE.dialog.open('User Input', userForm);

The above example uses a form which is more suitable for complex user input. If you want to get just a single input you 
may consider using javascript prompt(). Here is an example that gets image URL as a user input
js:
var url = prompt('URL', '');//prompt for URL
var code = '<img src="'+ url +'" />';//put the url into the code.
E.replaceSelection(code);//replace the selection with the code.


How to create a button to insert XHTML-compliant Underlined text?

Since <u> is not XHTML-compatible, you should use CSS. First of all, you need to define a class in your theme's 
CSS file, for instance; 
.underlined-text {text-decoration: underline;}
As the above class exists, you can use it in your button content:

<span class="underlined-text">%TEXT%</span>

Where %TEXT% will be replaced by the selected text in the textarea.


How to extend the functionality of Headers button to create a specialized tag chooser?
How to create an image chooser(ie. smiley chooser) using eDefTagChooser?

Firstly, we should understand what eDefTagChooser does.
eDefTagChooser(tags, applyTag, wrapEach, wrapAll, effect)
It accepts 5 parameters among which only the first one is required and the rest is optional.

Parameter "tags": is an array of tag infos, each having the format:
 [tag, title, attributes]
  tag: the tag that will enclose the selected text in the textarea
  title: the text or html to help the user choose this tag
  attributes: attriutes that will be inserted inside the tag. ex:{'id': 'site-name', 'class': 'dark'}

ex tags: [ ['span', 'Red', {'style': 'color: red'}], ['span', 'Blue', {'class': 'blue-text'}] ]
this will create two options:
Red (inserting <span style="color: red"></span>)
Blue (inserting <span class="blue-text"></span>)

Parameter "applyTag": if set to true, the title of the tag-info will be enclosed by the tag itself. This will allow
the user to preview the effect of the tag.
Ex: ['span', 'Red', {'style': 'color: red'}] will genarate an option
- with applyTag=false : Red (text only)
- with applyTag=true : <span style="color: red">Red</span>

Parameter "wrapEach": the tag that will enclose each option.
This can be set to 'div' to make sure that each option is in a new line.

Parameter "wrapAll": the tag that will enclose the whole block of options.
Having set the parameter wrapEach to 'li' this can be set to 'ul' in order to create a proper list of options.

Parameter "effect": one of the jQuery effects for opening the dialog ('slideDown' or 'fadeIn')

Knowing the details we can create our customized tag chooser.
Let's, for example, add styled headers to the default header chooser.
js: eDefTagChooser([
 ['h1', 'Header1'],
 ['h1', 'Header1-title', {'class': 'title'}],// this will insert <h1 class="title"></h1>
 ['h2', 'Header2'],
 ['h1', 'Header2-title', {'class': 'title'}],
 ['h3', 'Header3'],
 ['h4', 'Header4']
], true, 'li', 'ul', 'slideDown');

Now, let's create an image chooser
There will be no title for our tags since we will use applyTag to preview the image that will be inserted. However we
will be using a line break for every N(=4 in our example) image in order to create rows of options. Otherwise,
all of them will be placed in a single row.
js: eDefTagChooser([
 ['img', '', {'src': '/path-to-images/img1.png'}],//better to set also the width & height & alt attributes
 ['img', '', {'src': '/path-to-images/img2.png'}],
 ['img', '', {'src': '/path-to-images/img3.png'}],
 ['img', '<br />', {'src': '/path-to-images/img4.png'}],//line break added after 4th
 ['img', '', {'src': '/path-to-images/img5.png'}],
 ['img', '', {'src': '/path-to-images/img6.png'}],
 ['img', '', {'src': '/path-to-images/img7.png'}],
 ['img', '<br />', {'src': '/path-to-images/img8.png'}],//br after 8th
 ['img', '', {'src': '/path-to-images/img9.png'}],
 ['img', '', {'src': '/path-to-images/img10.png'}]
], true, '', '', 'slideDown');


While inserting a single tag should we use the classic <tag>%TEXT%</tag> pattern or the new eDefTagger('tag') ?
What is the difference between <tag>%TEXT%</tag> and js:eDefTagger('tag') ?

First of all, the classic tag insertion method does not require the default buttons library, whereas eDefTagger is a part of
the default buttons library.

- Classic method preserves the selected text after tag insertion, whereas eDefTagger selects the whole insertion.
Classic method: converts the selection "foo" to "<tag>foo</tag>", ("foo" still being selected)
eDefTagger('tag'): converts the selection "foo" to "<tag>foo</tag>" (<tag>foo</tag> is selected)

- Classic method doesnt parse the selection to check if it is an instance of the tag, whereas eDefTagger does and toggles it.
Classic method: converts the selection "<tag>foo</tag>" to "<tag><tag>foo</tag></tag>"
eDefTagger('tag'): converts the selection "<tag>foo</tag>" to "foo"

- In classic method you define the attributes of the tag in the usual way, whereas in eDefTagger you pass them as an object
<tag class="foo" id="bar">%TEXT%</tag> <=> eDefTagger('tag', {'class': 'foo', 'id': 'bar'})

- In classic method It's possible to use the selected text for any purpose, whereas in eDefTagger the only goal is to html.
 Classic method can use the selection multiple times and do anything with it: [bbcode]%TEXT%[/bbcode]: (%TEXT%)

It's up to you which method to use. Select the method that fits best to your needs.