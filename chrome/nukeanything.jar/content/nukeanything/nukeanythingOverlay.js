/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 *
 * Copyright (c) 2001-2002  Ted Mielczarek
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */
var NukeAnything = {
	RemovedObjects: Array(),
	BlinkId: Array(),
	blink_style: Object,
	init: function()
	{
		var menu = document.getElementById("contentAreaContextMenu");
		menu.addEventListener("popupshowing", NukeAnything.showHide, false);

		// stick the Nuke Frame item where it ought to go
		var menuitem = document.getElementById("nukeanything-do-nuke-frame");
		var menupopup = document.getElementById("frame").firstChild;
		menuitem.parentNode.removeChild(menuitem);
		menupopup.appendChild(menuitem);
	},

	showHide: function()
	{
		if (gContextMenu)
		{
			var menuitem = document.getElementById("nukeanything-do-nuke");
			if (menuitem)
				menuitem.hidden = gContextMenu.isContentSelection();
			menuitem = document.getElementById("nukeanything-do-nuke-selection");
			if (menuitem)
				menuitem.hidden = !gContextMenu.isContentSelection();

			menuitem = document.getElementById("nukeanything-do-leave-selection");
			if (menuitem)
				menuitem.hidden = !gContextMenu.isContentSelection();

			menuitem = document.getElementById("nukeanything-undo-nuke");
			if (menuitem)
				menuitem.hidden = !(NukeAnything.RemovedObjects.length);

			// shouldn't need this since the entire frame submenu is hidden
			menuitem = document.getElementById("nukeanything-do-nuke-frame");
			if (menuitem)
				menuitem.hidden = !NukeAnything.is_iframe();
		}
	},

	undoNukeAnything: function()
	{
		if (gContextMenu)
		{
			var c = NukeAnything.RemovedObjects.length - 1;
			if (NukeAnything.RemovedObjects[c].hasOwnProperty("display"))
			{
				NukeAnything.RemovedObjects[c]['obj'].style.display = NukeAnything.RemovedObjects[c]['display'];
			}
			else
			{
				NukeAnything.RemovedObjects[c]['obj'].style.backgroundImage = NukeAnything.RemovedObjects[c]['background-image'];
			}
			NukeAnything.RemovedObjects.splice(c, 1);
		}
	},
	blink: function blink(node)
	{
		if (!node) return;
		if (node.nodeType == null) return;
		if (node.nodeType == 3) return;
		if (node.documentElement) return;

		var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		NukeAnything.blink_style = prefManager.getCharPref('extensions.nuke_anything_enhanced.autoblink');
		if (!NukeAnything.blink_style) return;


		function setOutline(o)
		{
			return function()
			{
				node.style.outline = o;
			}
		}

		for (var i = 1; i < 7; ++i)
			setTimeout(setOutline((i % 2) ? NukeAnything.blink_style : 'none'), i * 100);
	},

	doHighlight: function()
	{
		if (gContextMenu)
		{
			var obj = gContextMenu.target;
			if (obj)
			{
				var id = setTimeout(function()
				{
					NukeAnything.blink(obj)
				}, 1000);
				NukeAnything.BlinkId.push(id);
			}
		}
	},
	cancelHighlight: function()
	{
		if (gContextMenu)
		{
			var obj = gContextMenu.target;
			if (obj && NukeAnything.BlinkId)
			{
				var id = NukeAnything.BlinkId.pop();
				if (id)
				{
					clearTimeout(id);
				}
			}
		}
	},

	doNukeAnything: function()
	{
		if (gContextMenu)
		{
			var obj = gContextMenu.target;
			if (obj)
			{
				if (obj.tagName == 'BODY' || obj.tagName == 'HTML')
				{
					// Remove background on body in this case
					var nodes = obj.ownerDocument.getElementsByTagName('body');
					if (nodes && nodes[0])
					{
						var c = NukeAnything.RemovedObjects.length;
						NukeAnything.RemovedObjects[c] = {
							'obj': nodes[0],
							'background-image': nodes[0].style.backgroundImage
						};
						nodes[0].style.backgroundImage = "none";
					}
					nodes = obj.ownerDocument.getElementsByTagName('html');
					if (nodes && nodes[0])
					{
						var c = NukeAnything.RemovedObjects.length;
						NukeAnything.RemovedObjects[c] = {
							'obj': nodes[0],
							'background-image': nodes[0].style.backgroundImage
						};
						nodes[0].style.backgroundImage = "none";
					}
				}
				else
				{
					// go away!
					var c = NukeAnything.RemovedObjects.length;
					NukeAnything.RemovedObjects[c] = {
						'obj': obj,
						'display': obj.style.display
					};
					obj.style.display = "none";
				}
			}
		}
	},

	doNukeSelection: function()
	{
		var focusedWindow = document.commandDispatcher.focusedWindow;
		/******* Update by pat to make it compatible with firefox 1.0.3 **************/
		//var sel = focusedWindow.__proto__.getSelection.call(focusedWindow);				   //Only works before 1.0.3
		//var sel = focusedWindow .getSelection();											  //Only works in 1.0.3
		var winWrapper = new XPCNativeWrapper(focusedWindow, 'document', 'getSelection()'); //******
		var docWrapper = new XPCNativeWrapper(winWrapper.document, 'title'); //****** Should work in all version
		var sel = winWrapper.getSelection(); //******
		// boom!
		sel.deleteFromDocument();
		sel.collapseToStart();
	},

	doLeaveSelection: function()
	{
		var focusedWindow = document.commandDispatcher.focusedWindow;
		/******* Update by pat to make it compatible with firefox 1.0.3 **************/
		//var sel = focusedWindow.__proto__.getSelection.call(focusedWindow);				   //Only works before 1.0.3
		//var sel = focusedWindow .getSelection();											  //Only works in 1.0.3
		var winWrapper = new XPCNativeWrapper(focusedWindow, 'document', 'getSelection()'); //******
		var docWrapper = new XPCNativeWrapper(winWrapper.document, 'title'); //****** Should work in all version
		var sel = winWrapper.getSelection(); //******
		// boom!
		var r = document.createRange();
		//Remove stuff after the range in the same node
		var current_range = sel.getRangeAt(sel.rangeCount - 1);
		r.setStart(current_range.endContainer, current_range.endOffset);
		r.setEndAfter(current_range.endContainer);
		r.deleteContents();

		//Remove stuff before the range in the same node
		current_range = sel.getRangeAt(0);
		r.setStart(current_range.startContainer, 0);
		r.setEnd(current_range.startContainer, current_range.startOffset);
		r.deleteContents();

		//Delete the nodes after the last selected element
		var current_node;
		current_node = sel.getRangeAt(sel.rangeCount - 1).endContainer;
		//~ current_node = sel.getRangeAt(0).endContainer;
		while (current_node.tagName != 'BODY')
		{
			while (delete_node = current_node.nextSibling)
			{
				if (delete_node.nodeType == 1)
				{
					delete_node.style.display = "none";
				}
				else if (delete_node.nodeType == 3)
				{
					delete_node.nodeValue = '';
				}
				current_node = delete_node;
			}
			current_node = current_node.parentNode;
		}

		//Delete the nodes before the first selected element
		current_node = sel.getRangeAt(0).startContainer;
		while (current_node.tagName != 'BODY')
		{
			while (delete_node = current_node.previousSibling)
			{
				if (delete_node.nodeType == 1)
				{
					delete_node.style.display = "none";
				}
				else if (delete_node.nodeType == 3)
				{
					delete_node.nodeValue = '';
				}
				current_node = delete_node;
			}
			current_node = current_node.parentNode;
		}
		current_node.style.backgroundImage = "none";
		current_node.parentNode.style.backgroundImage = "none";
	},

	checkFrames: function(frames, framedoc)
	{
		if (!frames || frames.length == 0)
			return false;

		for (var f = 0; f < frames.length; f++)
		{
			if (frames[f].contentDocument == framedoc)
			{
				// go away!
				var c = NukeAnything.RemovedObjects.length;
				NukeAnything.RemovedObjects[c] = {
					'obj': frames[f],
					'display': frames[f].style.display
				};
				frames[f].style.display = "none";
				return true;
			}
			// check to see if this document has frames in it
			var doc = frames[f].contentDocument;
			//~ if(NukeAnything.checkFrames(doc.getElementsByTagName("frame"), framedoc))
			//~ return true;
			if (NukeAnything.checkFrames(doc.getElementsByTagName("iframe"), framedoc))
				return true;
		}
		return false;
	},

	doNukeFrame: function()
	{
		var b = getBrowser();
		if (gContextMenu && b)
		{
			var framedoc = gContextMenu.target.ownerDocument;
			if (framedoc)
			{
				var doc = b.contentDocument;
				//~ NukeAnything.checkFrames(doc.getElementsByTagName("frame"), framedoc);
				NukeAnything.checkFrames(doc.getElementsByTagName("iframe"), framedoc);
			}
		}
	},

	is_iframe: function()
	{
		//~ return true;
		if (!gContextMenu) return false;
		if (!gContextMenu.inFrame) return false;
		var b = getBrowser();
		if (!b) return false;
		var framedoc = gContextMenu.target.ownerDocument;
		if (!framedoc) return false;

		var doc = b.contentDocument;
		var frames = doc.getElementsByTagName("iframe");
		if (!frames || frames.length == 0) return false;

		for (var f = 0; f < frames.length; f++)
		{
			if (frames[f].contentDocument == framedoc)
			{
				return true;
			}
		}
		return false;
	}
}

// do the init on load
window.addEventListener("load", NukeAnything.init, false);
