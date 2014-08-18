String.extend({
	deCamelize : function() {
		return this.replace(/([a-z])([A-Z])/g, "$1 $2")
	},
	trunc : function(b, a) {
		if (!a) {
			a = "..."
		}
		return (this.length < b) ? this : this.substring(0, b) + a
	},
	stripScripts : function() {
		var a = this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function() {
			return ""
		});
		return a
	}
});
function $getText(a) {
	return a.innerText || a.textContent || ""
}
Element.extend({
	wrapChildren : function(a) {
		while (a.firstChild) {
			this.appendChild(a.firstChild)
		}
		a.appendChild(this);
		return this
	},
	visible : function() {
		var a = this;
		while ($type(a) == "element") {
			if (a.getStyle("visibility") == "hidden") {
				return false
			}
			if (a.getStyle("display") == "none") {
				return false
			}
			a = a.getParent()
		}
		return true
	},
	hide : function() {
		return this.setStyle("display", "none")
	},
	show : function() {
		return this.setStyle("display", "")
	},
	toggle : function() {
		return this.visible() ? this.hide() : this.show()
	},
	scrollTo : function(a, b) {
		this.scrollLeft = a;
		this.scrollTop = b
	},
	getPosition : function(a) {
		a = a || [];
		var b = this, d = 0, c = 0;
		do {
			d += b.offsetLeft || 0;
			c += b.offsetTop || 0;
			b = b.offsetParent
		} while (b);
		a.each(function(e) {
			d -= e.scrollLeft || 0;
			c -= e.scrollTop || 0
		});
		return {
			x : d,
			y : c
		}
	},
	getDefaultValue : function() {
		switch (this.getTag()) {
		case "select":
			var a = [];
			$each(this.options, function(b) {
				if (b.defaultSelected) {
					a.push($pick(b.value, b.text))
				}
			});
			return (this.multiple) ? a : a[0];
		case "input":
			if (!(this.defaultChecked && [ "checkbox", "radio" ]
					.contains(this.type))
					&& ![ "hidden", "text", "password" ].contains(this.type)) {
				break
			}
		case "textarea":
			return this.defaultValue
		}
		return false
	}
});
var Observer = new Class({
	initialize : function(c, b, a) {
		this.options = Object.extend({
			event : "keyup",
			delay : 300
		}, a || {});
		this.element = $(c);
		this.callback = b;
		this.timeout = null;
		this.listener = this.fired.bind(this);
		this.value = this.element.getValue();
		this.element.setProperty("autocomplete", "off").addEvent(
				this.options.event, this.listener)
	},
	fired : function() {
		if (this.value == this.element.value) {
			return
		}
		this.clear();
		this.value = this.element.value;
		this.timeout = this.callback.delay(this.options.delay, null,
				[ this.element ])
	},
	clear : function() {
		this.timeout = $clear(this.timeout)
	},
	stop : function() {
		this.element.removeEvent(this.options.event, this.listener);
		this.clear()
	}
});
Element.extend({
	observe : function(b, a) {
		return new Observer(this, b, a)
	}
});
var LocalizedStrings = LocalizedStrings || [];
String.extend({
	localize : function() {
		var b = LocalizedStrings["javascript." + this], a = arguments;
		if (!b) {
			return ("???" + this + "???")
		}
		return b.replace(/\{(\d)\}/g, function(c) {
			return a[c.charAt(1)] || "???" + c.charAt(1) + "???"
		})
	}
});
Number.REparsefloat = new RegExp("([+-]?\\d+(:?\\.\\d+)?(:?e[-+]?\\d+)?)", "i");
function $T(b) {
	var a = $(b);
	return (a && a.tBodies[0]) ? $(a.tBodies[0]) : a
}
function getAncestorByTagName(b, a) {
	if (!b) {
		return null
	}
	if (b.nodeType == 1 && (b.tagName.toLowerCase() == a.toLowerCase())) {
		return b
	} else {
		return getAncestorByTagName(b.parentNode, a)
	}
}
var Wiki = {
	onPageLoad : function() {
		if (this.prefs) {
			return
		}
		$$("meta").each(function(d) {
			var e = d.getProperty("name") || "";
			if (e.indexOf("wiki") == 0) {
				this[e.substr(4)] = d.getProperty("content")
			}
		}, this);
		var a = location.host;
		this.BasePath = this.BaseUrl.slice(this.BaseUrl.indexOf(a) + a.length,
				-1);
		if (this.BasePath == "") {
			this.BasePath = "/"
		}
		this.prefs = new Hash.Cookie("JSPWikiUserPrefs", {
			path : Wiki.BasePath,
			duration : 20
		});
		this.PermissionEdit = !!$$("a.edit")[0];
		this.url = null;
		this.parseLocationHash.periodical(500);
		this.makeMenuFx("morebutton", "morepopup");
		this.addEditLinks();
		var c = $("page");
		if (c) {
			this.renderPage(c, Wiki.PageName)
		}
		var b = $("favorites");
		if (b) {
			this.renderPage(b, "Favorites")
		}
	},
	alert : function(a) {
		return alert(a)
	},
	prompt : function(b, a, c) {
		return c(prompt(b, a))
	},
	renderPage : function(b, a) {
		this.$pageHandlers.each(function(c) {
			c.render(b, a)
		})
	},
	addPageRender : function(a) {
		if (!this.$pageHandlers) {
			this.$pageHandlers = []
		}
		this.$pageHandlers.push(a)
	},
	setFocus : function() {
		[ "editorarea", "j_username", "loginname", "assertedName", "query2" ]
				.some(function(a) {
					a = $(a);
					if (a && a.visible()) {
						a.focus();
						return true
					}
					return false
				})
	},
	getUrl : function(a) {
		return this.PageUrl.replace(/%23%24%25/, a)
	},
	getPageName : function(a) {
		var c = this.PageUrl.escapeRegExp().replace(/%23%24%25/, "(.+)"), b = a
				.match(new RegExp(c));
		return (b ? b[1] : false)
	},
	cleanLink : function(a) {
		return a.trim().replace(/\s+/g, " ").replace(
				/[^A-Za-z0-9()&+,-=._$ ]/g, "")
	},
	changeOrientation : function() {
		var a = $("prefOrientation").getValue();
		$("wikibody").removeClass("fav-left").removeClass("fav-right")
				.addClass(a)
	},
	makeMenuFx : function(a, c) {
		var a = $(a), c = $(c);
		if (!a || !c) {
			return
		}
		var b = c.effect("opacity", {
			wait : false
		}).set(0);
		a.adopt(c).set({
			href : "#",
			events : {
				mouseout : function() {
					b.start(0)
				},
				mouseover : function() {
					Wiki.locatemenu(a, c);
					b.start(0.9)
				}
			}
		})
	},
	locatemenu : function(c, d) {
		var f = {
			x : window.getWidth(),
			y : window.getHeight()
		}, i = {
			x : window.getScrollLeft(),
			y : window.getScrollTop()
		}, j = c.getPosition(), e = {
			x : c.offsetWidth - d.offsetWidth,
			y : c.offsetHeight
		}, b = {
			x : d.offsetWidth,
			y : d.offsetHeight
		}, a = {
			x : "left",
			y : "top"
		};
		for ( var g in a) {
			var h = j[g] + e[g];
			if ((h + b[g] - i[g]) > f[g]) {
				h = f[g] - b[g] + i[g]
			}
			d.setStyle(a[g], h)
		}
	},
	parseLocationHash : function() {
		if (this.url && this.url == location.href) {
			return
		}
		this.url = location.href;
		var b = location.hash;
		if (b == "") {
			return
		}
		b = b.replace(/^#/, "");
		var a = $(b);
		while ($type(a) == "element") {
			if (a.hasClass("hidetab")) {
				TabbedSection.click.apply($("menu-" + a.id))
			} else {
				if (a.hasClass("tab")) {
				} else {
					if (a.hasClass("collapsebody")) {
					} else {
						if (!a.visible()) {
						}
					}
				}
			}
			a = a.getParent()
		}
		location = location.href
	},
	submitOnce : function(a) {
		window.onbeforeunload = null;
		(function() {
			$A(a.elements).each(function(b) {
				if ((/submit|button/i).test(b.type)) {
					b.disabled = true
				}
			})
		}).delay(10);
		return true
	},
	submitUpload : function(b, a) {
		$("progressbar").setStyle("visibility", "visible");
		this.progressbar = Wiki.jsonrpc.periodical(1000, this, [
				"progressTracker.getProgress",
				[ a ],
				function(c) {
					c = c.stripScripts();
					if (!c.code) {
						$("progressbar").getFirst().setStyle("width", c + "%")
								.setHTML(c + "%")
					}
				} ]);
		return Wiki.submitOnce(b)
	},
	addEditLinks : function() {
		if ($("previewcontent") || !this.PermissionEdit
				|| this.prefs.get("SectionEditing") != "on") {
			return
		}
		var c = new Element("a", {
			"class" : "editsection"
		}).setHTML("quick.edit".localize()), b = 0, a = this.EditUrl;
		a = a + (a.contains("?") ? "&" : "?") + "section=";
		this.getSections().each(function(d) {
			d.adopt(c.set({
				href : a + b++
			}).clone())
		})
	},
	getSections : function() {
		return $$("#pagecontent *[id^=section]").filter(function(a) {
			return (a.id != "section-TOC")
		})
	},
	$jsonid : 10000,
	jsonrpc : function(c, b, a) {
		new Ajax(Wiki.JsonUrl, {
			postBody : Json.toString({
				id : Wiki.$jsonid++,
				method : c,
				params : b
			}),
			method : "post",
			onComplete : function(d) {
				var e = Json.evaluate(d, true);
				if (e) {
					if (e.result) {
						a(e.result)
					} else {
						if (e.error) {
							a(e.error)
						}
					}
				}
			}
		}).request()
	}
};
var WikiSlimbox = {
	render : function(c, a) {
		var b = 0, d = new Element("a", {
			"class" : "slimbox"
		}).setHTML("&raquo;");
		$ES("*[class^=slimbox]", c)
				.each(
						function(f) {
							var g = "lightbox" + b++, h = f.className
									.split("-")[1]
									|| "img ajax", e = [];
							if (h.test("img")) {
								e.extend([ "img.inline", "a.attachment" ])
							}
							if (h.test("ajax")) {
								e.extend([ "a.wikipage", "a.external" ])
							}
							$ES(e.join(","), f)
									.each(
											function(k) {
												var j = k.src || k.href, i = (k.className
														.test("inline|attachment")) ? "img"
														: "ajax";
												if ((i == "img")
														&& !j
																.test(
																		"(.bmp|.gif|.png|.jpg|.jpeg)(\\?.*)?$",
																		"i")) {
													return
												}
												d
														.clone()
														.setProperties(
																{
																	href : j,
																	rel : g
																			+ " "
																			+ i,
																	title : k.alt
																			|| k
																					.getText()
																})
														.injectBefore(k);
												if (k.src) {
													k
															.replaceWith(new Element(
																	"a",
																	{
																		"class" : "attachment",
																		href : k.src
																	})
																	.setHTML(k.alt
																			|| k
																					.getText()))
												}
											})
						});
		if (b) {
			Lightbox.init()
		}
	}
};
Wiki.addPageRender(WikiSlimbox);
var Lightbox = {
	init : function(a) {
		this.options = $extend({
			resizeDuration : 400,
			resizeTransition : false,
			initialWidth : 250,
			initialHeight : 250,
			animateCaption : true,
			errorMessage : "slimbox.error".localize()
		}, a || {});
		this.anchors = [];
		$each(document.links, function(d) {
			if (d.rel && d.rel.test(/^lightbox/i)) {
				d.onclick = this.click.pass(d, this);
				this.anchors.push(d)
			}
		}, this);
		this.eventKeyDown = this.keyboardListener.bindAsEventListener(this);
		this.eventPosition = this.position.bind(this);
		this.overlay = new Element("div", {
			id : "lbOverlay"
		}).inject(document.body);
		this.center = new Element("div", {
			id : "lbCenter",
			styles : {
				width : this.options.initialWidth,
				height : this.options.initialHeight,
				marginLeft : -(this.options.initialWidth / 2),
				display : "none"
			}
		}).inject(document.body);
		new Element("a", {
			id : "lbCloseLink",
			href : "#",
			title : "slimbox.close.title".localize()
		}).inject(this.center).onclick = this.overlay.onclick = this.close
				.bind(this);
		this.image = new Element("div", {
			id : "lbImage"
		}).inject(this.center);
		this.bottomContainer = new Element("div", {
			id : "lbBottomContainer",
			styles : {
				display : "none"
			}
		}).inject(document.body);
		this.bottom = new Element("div", {
			id : "lbBottom"
		}).inject(this.bottomContainer);
		this.caption = new Element("div", {
			id : "lbCaption"
		}).inject(this.bottom);
		var b = new Element("div").inject(this.bottom);
		this.prevLink = new Element("a", {
			id : "lbPrevLink",
			href : "#",
			styles : {
				display : "none"
			}
		}).setHTML("slimbox.previous".localize()).inject(b);
		this.number = new Element("span", {
			id : "lbNumber"
		}).inject(b);
		this.nextLink = this.prevLink.clone().setProperties({
			id : "lbNextLink"
		}).setHTML("slimbox.next".localize()).inject(b);
		this.prevLink.onclick = this.previous.bind(this);
		this.nextLink.onclick = this.next.bind(this);
		this.error = new Element("div").setProperty("id", "lbError").setHTML(
				this.options.errorMessage);
		new Element("div", {
			styles : {
				clear : "both"
			}
		}).inject(this.bottom);
		var c = this.nextEffect.bind(this);
		this.fx = {
			overlay : this.overlay.effect("opacity", {
				duration : 500
			}).hide(),
			resize : this.center.effects($extend({
				duration : this.options.resizeDuration,
				onComplete : c
			}, this.options.resizeTransition ? {
				transition : this.options.resizeTransition
			} : {})),
			image : this.image.effect("opacity", {
				duration : 500,
				onComplete : c
			}),
			bottom : this.bottom.effect("margin-top", {
				duration : 400,
				onComplete : c
			})
		};
		this.fxs = new Fx.Elements([ this.center, this.image ], $extend({
			duration : this.options.resizeDuration,
			onComplete : c
		}, this.options.resizeTransition ? {
			transition : this.options.resizeTransition
		} : {}));
		this.preloadPrev = new Image();
		this.preloadNext = new Image()
	},
	click : function(d) {
		var b = d.rel.split(" ");
		if (b[0].length == 8) {
			return this.open([ [ url, title, b[1] ] ], 0)
		}
		var c = 0, a = [];
		this.anchors.each(function(f) {
			var e = f.rel.split(" ");
			if (e[0] != b[0]) {
				return
			}
			if ((f.href == d.href) && (f.title == d.title)) {
				c = a.length
			}
			a.push([ f.href, f.title, e[1] ])
		});
		return this.open(a, c)
	},
	open : function(a, b) {
		this.images = a;
		this.position();
		this.setup(true);
		this.top = window.getScrollTop() + (window.getHeight() / 15);
		this.center.setStyles({
			top : this.top,
			display : ""
		});
		this.fx.overlay.start(0.7);
		return this.changeImage(b)
	},
	position : function() {
		this.overlay.setStyles({
			top : window.getScrollTop(),
			height : window.getHeight()
		})
	},
	setup : function(a) {
		var c = $A(document.getElementsByTagName("object"));
		c.extend(document.getElementsByTagName(window.ie ? "select" : "embed"));
		c.each(function(d) {
			if (a) {
				d.lbBackupStyle = d.style.visibility
			}
			d.style.visibility = a ? "hidden" : d.lbBackupStyle
		});
		var b = a ? "addEvent" : "removeEvent";
		window[b]("scroll", this.eventPosition)[b]
				("resize", this.eventPosition);
		document[b]("keydown", this.eventKeyDown);
		this.step = 0
	},
	keyboardListener : function(a) {
		switch (a.keyCode) {
		case 27:
		case 88:
		case 67:
			this.close();
			break;
		case 37:
		case 38:
		case 80:
			this.previous();
			break;
		case 13:
		case 32:
		case 39:
		case 40:
		case 78:
			this.next();
			break;
		default:
			return
		}
		new Event(a).stop()
	},
	previous : function() {
		return this.changeImage(this.activeImage - 1)
	},
	next : function() {
		return this.changeImage(this.activeImage + 1)
	},
	changeImage : function(a) {
		if (this.step || (a < 0) || (a >= this.images.length)) {
			return false
		}
		this.step = 1;
		this.activeImage = a;
		this.center.style.backgroundColor = "";
		this.bottomContainer.style.display = this.prevLink.style.display = this.nextLink.style.display = "none";
		this.fx.image.hide();
		this.center.className = "lbLoading";
		this.preload = new Image();
		this.image.empty().setStyle("overflow", "hidden");
		if (this.images[a][2] == "img") {
			this.preload.onload = this.nextEffect.bind(this);
			this.preload.src = this.images[a][0]
		} else {
			this.iframeId = "lbFrame_" + new Date().getTime();
			this.so = new Element("iframe").setProperties({
				id : this.iframeId,
				frameBorder : 0,
				scrolling : "auto",
				src : this.images[a][0]
			}).inject(this.image);
			this.nextEffect()
		}
		return false
	},
	ajaxFailure : function() {
		this.ajaxFailed = true;
		this.image.setHTML("").adopt(this.error.clone());
		this.nextEffect()
	},
	nextEffect : function() {
		switch (this.step++) {
		case 1:
			this.center.className = "";
			this.caption.empty().adopt(new Element("a", {
				href : this.images[this.activeImage][0],
				title : "slimbox.directLink".localize()
			}).setHTML(this.images[this.activeImage][1] || ""));
			var d = (this.images[this.activeImage][2] == "img") ? "slimbox.info"
					: "slimbox.remoteRequest";
			this.number.setHTML((this.images.length == 1) ? "" : d.localize(
					this.activeImage + 1, this.images.length));
			this.image.style.backgroundImage = "none";
			var b = Math.max(this.options.initialWidth, this.preload.width), c = Math
					.max(this.options.initialHeight, this.preload.height), e = Window
					.getWidth() - 10, a = Window.getHeight() - 120;
			if (this.images[this.activeImage][2] != "img" && !this.ajaxFailed) {
				b = 6000;
				c = 3000
			}
			if (b > e) {
				c = Math.round(c * e / b);
				b = e
			}
			if (c > a) {
				b = Math.round(b * a / c);
				c = a
			}
			this.image.style.width = this.bottom.style.width = b + "px";
			this.image.style.height = c + "px";
			if (this.images[this.activeImage][2] == "img") {
				this.image.style.backgroundImage = "url("
						+ this.images[this.activeImage][0] + ")";
				if (this.activeImage) {
					this.preloadPrev.src = this.images[this.activeImage - 1][0]
				}
				if (this.activeImage != (this.images.length - 1)) {
					this.preloadNext.src = this.images[this.activeImage + 1][0]
				}
				this.number.setHTML(this.number.innerHTML + "&nbsp;&nbsp;["
						+ this.preload.width + "&#215;" + this.preload.height
						+ "]")
			} else {
				this.so.style.width = b + "px";
				this.so.style.height = c + "px"
			}
			if (this.options.animateCaption) {
				this.bottomContainer.setStyles({
					height : "0px",
					display : ""
				})
			}
			this.fxs.start({
				"0" : {
					height : [ this.image.offsetHeight ],
					width : [ this.image.offsetWidth ],
					marginLeft : [ -this.image.offsetWidth / 2 ]
				},
				"1" : {
					opacity : [ 1 ]
				}
			});
			break;
		case 2:
			this.image.setStyle("overflow", "auto");
			this.bottomContainer.setStyles({
				top : (this.top + this.center.clientHeight) + "px",
				marginLeft : this.center.style.marginLeft
			});
			if (this.options.animateCaption) {
				this.fx.bottom.set(-this.bottom.offsetHeight);
				this.bottomContainer.style.height = "";
				this.fx.bottom.start(0);
				break
			}
			this.bottomContainer.style.height = "";
		case 3:
			if (this.activeImage) {
				this.prevLink.style.display = ""
			}
			if (this.activeImage != (this.images.length - 1)) {
				this.nextLink.style.display = ""
			}
			this.step = 0
		}
	},
	close : function() {
		if (this.step < 0) {
			return
		}
		this.step = -1;
		if (this.preload) {
			this.preload.onload = Class.empty;
			this.preload = null
		}
		for ( var a in this.fx) {
			this.fx[a].stop()
		}
		this.center.style.display = this.bottomContainer.style.display = "none";
		this.fx.overlay.chain(this.setup.pass(false, this)).start(0);
		this.image.empty();
		return false
	}
};
var TabbedSection = {
	render : function(b, a) {
		$ES(".tabmenu a", b).each(function(c) {
			if (!c.href) {
				c.addEvent("click", this.click)
			}
		}, this);
		$ES(".tabbedSection", b).each(function(c) {
			if (c.hasClass("tabs")) {
				return
			}
			c.addClass("tabs");
			var d = new Element("div", {
				"class" : "tabmenu"
			}).injectBefore(c);
			c.getChildren().each(function(g, f) {
				var e = g.className;
				if (!e.test("^tab-")) {
					return
				}
				if (!g.id || (g.id == "")) {
					g.id = e
				}
				(f == 0) ? g.removeClass("hidetab") : g.addClass("hidetab");
				new Element("div", {
					"class" : "clearbox"
				}).inject(g);
				var h = e.substr(4).deCamelize();
				new Element("a", {
					id : "menu-" + g.id,
					"class" : (f == 0) ? "activetab" : "",
					events : {
						click : this.click
					}
				}).appendText(h).inject(d)
			}, this)
		}, this)
	},
	click : function() {
		var b = $(this).getParent(), a = b.getNext();
		b.getChildren().removeClass("activetab");
		this.addClass("activetab");
		a.getChildren().addClass("hidetab");
		a.getElementById(this.id.substr(5)).removeClass("hidetab")
	}
};
Wiki.addPageRender(TabbedSection);
var SearchBox = {
	onPageLoad : function() {
		this.onPageLoadQuickSearch();
		this.onPageLoadFullSearch()
	},
	onPageLoadQuickSearch : function() {
		var b = $("query");
		if (!b) {
			return
		}
		this.query = b;
		b.observe(this.ajaxQuickSearch.bind(this));
		this.hover = $("searchboxMenu").setProperty("visibility", "visible")
				.effect("opacity", {
					wait : false
				}).set(0);
		$(b.form).addEvent("submit", this.submit.bind(this)).addEvent(
				"mouseout", function() {
					this.hover.start(0)
				}.bind(this)).addEvent("mouseover", function() {
			Wiki.locatemenu(this.query, $("searchboxMenu"));
			this.hover.start(0.9)
		}.bind(this));
		$("recentClear").addEvent("click", this.clear.bind(this));
		this.recent = Wiki.prefs.get("RecentSearch");
		if (!this.recent) {
			return
		}
		var a = new Element("ul", {
			id : "recentItems"
		}).inject($("recentSearches").show());
		this.recent.each(function(c) {
			c = c.stripScripts();
			new Element("a", {
				href : "#",
				events : {
					click : function() {
						b.value = c;
						b.form.submit()
					}
				}
			}).setHTML(c).inject(new Element("li").inject(a))
		})
	},
	onPageLoadFullSearch : function() {
		var c = $("query2");
		if (!c) {
			return
		}
		this.query2 = c;
		var b = function() {
			var d = this.query2.value.replace(
					/^(?:author:|name:|contents:|attachment:)/, "");
			this.query2.value = $("scope").getValue() + d;
			this.runfullsearch()
		}.bind(this);
		c.observe(this.runfullsearch0.bind(this));
		$("scope").addEvent("change", b);
		$("details").addEvent("click", this.runfullsearch.bind(this));
		if (location.hash) {
			var a = decodeURIComponent(location.hash.substr(1)).match(
					/(.*):(-?\d+)$/);
			if (a && a.length == 3) {
				c.value = a[1];
				$("start").value = a[2];
				b()
			}
		}
	},
	runfullsearch0 : function() {
		$("start").value = "0";
		this.runfullsearch()
	},
	runfullsearch : function(c) {
		var d = this.query2.value;
		if (!d || (d.trim() == "")) {
			$("searchResult2").empty();
			return
		}
		$("spin").show();
		var b = $("scope"), a = d
				.match(/^(?:author:|name:|contents:|attachment:)/)
				|| "";
		$each(b.options, function(e) {
			if (e.value == a) {
				e.selected = true
			}
		});
		new Ajax(Wiki.TemplateUrl + "AJAXSearch.jsp", {
			postBody : $("searchform2").toQueryString(),
			update : "searchResult2",
			method : "post",
			onComplete : function() {
				$("spin").hide();
				GraphBar.render($("searchResult2"));
				Wiki.prefs.set("PrevQuery", d)
			}
		}).request();
		location.hash = "#" + d + ":" + $("start").value
	},
	submit : function() {
		var a = this.query.value.stripScripts();
		if (a == this.query.defaultValue) {
			this.query.value = ""
		}
		if (!this.recent) {
			this.recent = []
		}
		if (!this.recent.test(a)) {
			if (this.recent.length > 9) {
				this.recent.pop()
			}
			this.recent.unshift(a);
			Wiki.prefs.set("RecentSearch", this.recent)
		}
	},
	clear : function() {
		this.recent = [];
		Wiki.prefs.remove("RecentSearch");
		$("recentSearches", "recentClear").hide()
	},
	ajaxQuickSearch : function() {
		var a = this.query.value.stripScripts();
		if ((a == null) || (a.trim() == "") || (a == this.query.defaultValue)) {
			$("searchOutput").empty();
			return
		}
		$("searchTarget").setHTML("(" + a + ") :");
		$("searchSpin").show();
		Wiki.jsonrpc("search.findPages", [ a, 20 ], function(b) {
			$("searchSpin").hide();
			if (!b.list) {
				return
			}
			var c = new Element("ul");
			b.list.each(function(d) {
				new Element("li").adopt(new Element("a", {
					href : Wiki.getUrl(d.map.page)
				}).setHTML(d.map.page), new Element("span", {
					"class" : "small"
				}).setHTML(" (" + d.map.score + ")")).inject(c)
			});
			$("searchOutput").empty().adopt(c);
			Wiki.locatemenu($("query"), $("searchboxMenu"))
		})
	},
	navigate : function(b, a, h, d) {
		var g = Wiki.PageName, f = (h) ? g + "sbox.clone.suffix".localize() : g, e = this.query.value;
		if (e == this.query.defaultValue) {
			e = ""
		}
		var c = function(i) {
			if (i == "") {
				return
			}
			if (!d) {
				i = Wiki.cleanLink(i)
			}
			g = encodeURIComponent(g);
			i = encodeURIComponent(i);
			if (h && (i != g)) {
				i += "&clone=" + g
			}
			location.href = b.replace("__PAGEHERE__", i)
		};
		if (e != "") {
			c(e)
		} else {
			Wiki.prompt(a, f, c.bind(this))
		}
	}
};
var Color = new Class(
		{
			_HTMLColors : {
				black : "000000",
				green : "008000",
				silver : "c0c0c0",
				lime : "00ff00",
				gray : "808080",
				olive : "808000",
				white : "ffffff",
				yellow : "ffff00",
				maroon : "800000",
				navy : "000080",
				red : "ff0000",
				blue : "0000ff",
				purple : "800080",
				teal : "008080",
				fuchsia : "ff00ff",
				aqua : "00ffff"
			},
			initialize : function(a, c) {
				if (!a) {
					return false
				}
				c = c || (a.push ? "rgb" : "hex");
				if (this._HTMLColors[a]) {
					a = this._HTMLColors[a]
				}
				var b = (c == "rgb") ? a : a.toString().hexToRgb(true);
				if (!b) {
					return false
				}
				b.hex = b.rgbToHex();
				return $extend(b, Color.prototype)
			},
			mix : function() {
				var a = $A(arguments), b = this.copy(), c = (($type(a[a.length - 1]) == "number") ? a
						.pop()
						: 50) / 100, d = 1 - c;
				a.each(function(e) {
					e = new Color(e);
					for ( var f = 0; f < 3; f++) {
						b[f] = Math.round((b[f] * d) + (e[f] * c))
					}
				});
				return new Color(b, "rgb")
			},
			invert : function() {
				return new Color(this.map(function(a) {
					return 255 - a
				}))
			}
		});
var GraphBar = {
	render : function(b, a) {
		$ES("*[class^=graphBars]", b)
				.each(
						function(j) {
							var i = 20, c = 320, e = 20, s = null, r = null, q = false, n = false, l = true, o = j.className
									.substr(9).split("-"), h = o.shift();
							o
									.each(function(g) {
										g = g.toLowerCase();
										if (g == "vertical") {
											l = false
										} else {
											if (g == "progress") {
												n = true
											} else {
												if (g == "gauge") {
													q = true
												} else {
													if (g.indexOf("min") == 0) {
														i = g.substr(3).toInt()
													} else {
														if (g.indexOf("max") == 0) {
															c = g.substr(3)
																	.toInt()
														} else {
															if (g != "") {
																g = new Color(
																		g,
																		"hex");
																if (!g.hex) {
																	return
																}
																if (!s) {
																	s = g
																} else {
																	if (!r) {
																		r = g
																	}
																}
															}
														}
													}
												}
											}
										}
									});
							if (!r && s) {
								r = (q || n) ? s.invert() : s
							}
							if (i > c) {
								var d = c;
								c = i;
								c = d
							}
							var t = c - i;
							var p = $ES(".gBar" + h, j);
							if ((p.length == 0) && h && (h != "")) {
								p = this.getTableValues(j, h)
							}
							if (!p) {
								return
							}
							var k = this.parseBarData(p, i, t), f = (l ? "borderLeft"
									: "borderBottom");
							p
									.each(
											function(g, w) {
												var v = $H().set(f + "Width",
														k[w]), u = $H(), m = new Element(
														"span",
														{
															"class" : "graphBar"
														}), x = g.getParent();
												if (l) {
													m.setHTML("x");
													if (n) {
														u.extend(v.obj);
														v.set(f + "Width",
																c - k[w]).set(
																"marginLeft",
																"-1ex")
													}
												} else {
													if (x.getTag() == "td") {
														x = new Element("div")
																.wrapChildren(x)
													}
													x
															.setStyles({
																height : c
																		+ g
																				.getStyle(
																						"lineHeight")
																				.toInt(),
																position : "relative"
															});
													g.setStyle("position",
															"relative");
													if (!n) {
														g.setStyle("top",
																(c - k[w]))
													}
													v.extend({
														position : "absolute",
														width : e,
														bottom : "0"
													});
													if (n) {
														u.extend(v.obj).set(
																f + "Width", c)
													}
												}
												if (n) {
													if (s) {
														v.set("borderColor",
																s.hex)
													}
													if (r) {
														u.set("borderColor",
																r.hex)
													} else {
														v.set("borderColor",
																"transparent")
													}
												} else {
													if (s) {
														var y = q ? (k[w] - i)
																/ t
																: w
																		/ (p.length - 1);
														v
																.set(
																		"borderColor",
																		s
																				.mix(
																						r,
																						100 * y).hex)
													}
												}
												if (u.length > 0) {
													m.clone().setStyles(u.obj)
															.injectBefore(g)
												}
												if (v.length > 0) {
													m.setStyles(v.obj)
															.injectBefore(g)
												}
											}, this)
						}, this)
	},
	parseBarData : function(b, g, d) {
		var a = [], f = Number.MIN_VALUE, e = Number.MAX_VALUE, c = date = true;
		b.each(function(k, h) {
			var j = k.getText();
			a.push(j);
			if (c) {
				c = !isNaN(parseFloat(j.match(Number.REparsefloat)))
			}
			if (date) {
				date = !isNaN(Date.parse(j))
			}
		});
		a = a.map(function(h) {
			if (date) {
				h = new Date(Date.parse(h)).valueOf()
			} else {
				if (c) {
					h = parseFloat(h.match(Number.REparsefloat))
				}
			}
			f = Math.max(f, h);
			e = Math.min(e, h);
			return h
		});
		if (f == e) {
			f = e + 1
		}
		d = d / (f - e);
		return a.map(function(h) {
			return ((d * (h - e)) + g).toInt()
		})
	},
	getTableValues : function(g, j) {
		var f = $E("table", g);
		if (!f) {
			return false
		}
		var c = f.rows.length;
		if (c > 1) {
			var e = f.rows[0];
			for ( var d = 0; d < e.cells.length; d++) {
				if ($getText(e.cells[d]).trim() == j) {
					var a = [];
					for ( var b = 1; b < c; b++) {
						a.push(new Element("span")
								.wrapChildren(f.rows[b].cells[d]))
					}
					return a
				}
			}
		}
		for ( var d = 0; d < c; d++) {
			var e = f.rows[d];
			if ($getText(e.cells[0]).trim() == j) {
				var a = [];
				for ( var b = 1; b < e.cells.length; b++) {
					a.push(new Element("span").wrapChildren(e.cells[b]))
				}
				return a
			}
		}
		return false
	}
};
Wiki.addPageRender(GraphBar);
var Collapsible = {
	pims : [],
	render : function(c, a) {
		c = $(c);
		if (!c) {
			return
		}
		var b = Wiki.Context.test(/view|edit|comment/) ? "JSPWikiCollapse" + a
				: "";
		if (!this.bullet) {
			this.bullet = new Element("div", {
				"class" : "collapseBullet"
			}).setHTML("&bull;")
		}
		this.pims.push({
			name : b,
			value : "",
			initial : (b ? Cookie.get(b) : "")
		});
		$ES(".collapse", c).each(function(d) {
			if (!$E(".collapseBullet", d)) {
				this.collapseNode(d)
			}
		}, this);
		$ES(".collapsebox,.collapsebox-closed", c).each(function(d) {
			this.collapseBox(d)
		}, this)
	},
	collapseBox : function(d) {
		if ($E(".collapsetitle", d)) {
			return
		}
		var e = d.getFirst();
		if (!e) {
			return
		}
		var a = new Element("div", {
			"class" : "collapsebody"
		}), b = this.bullet.clone(), c = d.hasClass("collapsebox-closed");
		while (e.nextSibling) {
			a.appendChild(e.nextSibling)
		}
		d.appendChild(a);
		if (c) {
			d.removeClass("collapsebox-closed").addClass("collapsebox")
		}
		b.injectTop(e.addClass("collapsetitle"));
		this.newBullet(b, a, !c, e)
	},
	collapseNode : function(a) {
		$ES("li", a).each(function(b) {
			var d = $E("ul", b) || $E("ol", b);
			var e = true;
			for ( var f = b.firstChild; f; f = f.nextSibling) {
				if ((f.nodeType == 3) && (f.nodeValue.trim() == "")) {
					continue
				}
				if ((f.nodeName == "UL") || (f.nodeName == "OL")) {
					break
				}
				e = false;
				break
			}
			if (e) {
				return
			}
			new Element("div", {
				"class" : "collapsebody"
			}).wrapChildren(b);
			var c = this.bullet.clone().injectTop(b);
			if (d) {
				this.newBullet(c, d, (d.getTag() == "ul"))
			}
		}, this)
	},
	newBullet : function(c, a, f, e) {
		var d = this.pims.getLast();
		f = this.parseCookie(f);
		if (!e) {
			e = c
		}
		var b = a.setStyle("overflow", "hidden").effect("height", {
			wait : false,
			onStart : this.renderBullet.bind(c),
			onComplete : function() {
				if (c.hasClass("collapseOpen")) {
					a.setStyle("height", "auto")
				}
			}
		});
		c.className = (f ? "collapseClose" : "collapseOpen");
		e
				.addEvent(
						"click",
						this.clickBullet.bindWithEvent(c, [ d,
								d.value.length - 1, b ])).addEvent(
						"mouseenter", function() {
							e.addClass("hover")
						}).addEvent("mouseleave", function() {
					e.removeClass("hover")
				});
		b.fireEvent("onStart");
		if (!f) {
			b.set(0)
		}
	},
	renderBullet : function() {
		if (this.hasClass("collapseClose")) {
			this.setProperties({
				title : "collapse".localize(),
				"class" : "collapseOpen"
			}).setHTML("-")
		} else {
			this.setProperties({
				title : "expand".localize(),
				"class" : "collapseClose"
			}).setHTML("+")
		}
	},
	clickBullet : function(d, b, c, a) {
		var f = this.hasClass("collapseOpen"), e = a.element.scrollHeight;
		if (d.target == this) {
			if (f) {
				a.start(e, 0)
			} else {
				a.start(e)
			}
			b.value = b.value.slice(0, c) + (f ? "c" : "o")
					+ b.value.slice(c + 1);
			if (b.name) {
				Cookie.set(b.name, b.value, {
					path : Wiki.BasePath,
					duration : 20
				})
			}
		}
	},
	parseCookie : function(d) {
		var a = this.pims.getLast(), e = a.value.length, b = (d ? "o" : "c");
		if (a.initial && (a.initial.length > e)) {
			var c = a.initial.charAt(e);
			if ((d && (c == "c")) || (!d && (c == "o"))) {
				b = c
			}
			if (b != c) {
				a.initial = null
			}
		}
		a.value += b;
		return (b == "o")
	}
};
Wiki.addPageRender(Collapsible);
var Sortable = {
	render : function(b, a) {
		this.DefaultTitle = "sort.click".localize();
		this.AscendingTitle = "sort.ascending".localize();
		this.DescendingTitle = "sort.descending".localize();
		$ES(".sortable table", b)
				.each(
						function(c) {
							if (c.rows.length <= 2) {
								return
							}
							$A(c.rows[0].cells)
									.each(
											function(d) {
												d = $(d);
												if (d.getTag() == "th") {
													d
															.addEvent(
																	"click",
																	this.sort
																			.bind(
																					this,
																					[ d ]))
															.addClass("sort").title = this.DefaultTitle
												}
											}, this)
						}, this)
	},
	sort : function(a) {
		var h = getAncestorByTagName(a, "table"), b = (h.filterStack), i = (h.sortCache || []), c = 0, e = $T(h);
		a = $(a);
		$A(e.rows[0].cells)
				.each(
						function(j, k) {
							if (j.getTag() != "th") {
								return
							}
							if (a == j) {
								c = k;
								return
							}
							j.removeClass("sortAscending").removeClass(
									"sortDescending").addClass("sort").title = Sortable.DefaultTitle
						});
		if (i.length == 0) {
			$A(e.rows).each(function(k, j) {
				if ((j == 0) || ((j == 1) && (b))) {
					return
				}
				i.push(k)
			})
		}
		var d = Sortable.guessDataType(i, c);
		if (a.hasClass("sort")) {
			i.sort(Sortable.createCompare(c, d))
		} else {
			i.reverse()
		}
		var f = a.hasClass("sortDescending");
		a.removeClass("sort").removeClass("sortAscending").removeClass(
				"sortDescending");
		a.addClass(f ? "sortAscending" : "sortDescending").title = f ? Sortable.DescendingTitle
				: Sortable.AscendingTitle;
		var g = document.createDocumentFragment();
		i.each(function(k, j) {
			g.appendChild(k)
		});
		e.appendChild(g);
		h.sortCache = i;
		if (h.zebra) {
			h.zebra()
		}
	},
	guessDataType : function(c, b) {
		var a = date = ip4 = euro = kmgt = true;
		c.each(function(f, e) {
			var d = f.cells[b];
			d = d.getAttribute("jspwiki:sortvalue") || $getText(d);
			d = d.clean().toLowerCase();
			if (a) {
				a = !isNaN(parseFloat(d))
			}
			if (date) {
				date = !isNaN(Date.parse(d))
			}
			if (ip4) {
				ip4 = d.test(/(?:\\d{1,3}\\.){3}\\d{1,3}/)
			}
			if (euro) {
				euro = d.test(/^[£$€][0-9.,]+/)
			}
			if (kmgt) {
				kmgt = d.test(/(?:[0-9.,]+)\s*(?:[kmgt])b/)
			}
		});
		return (kmgt) ? "kmgt" : (euro) ? "euro" : (ip4) ? "ip4"
				: (date) ? "date" : (a) ? "num" : "string"
	},
	convert : function(e, c) {
		switch (c) {
		case "num":
			return parseFloat(e.match(Number.REparsefloat));
		case "euro":
			return parseFloat(e.replace(/[^0-9.,]/g, ""));
		case "date":
			return new Date(Date.parse(e));
		case "ip4":
			var a = e.split(".");
			return parseInt(a[0]) * 1000000000 + parseInt(a[1]) * 1000000
					+ parseInt(a[2]) * 1000 + parseInt(a[3]);
		case "kmgt":
			var b = e.toString().toLowerCase().match(/([0-9.,]+)\s*([kmgt])b/);
			if (!b) {
				return 0
			}
			var d = b[2];
			d = (d == "m") ? 3 : (d == "g") ? 6 : (d == "t") ? 9 : 0;
			return b[1].toFloat() * Math.pow(10, d);
		default:
			return e.toString().toLowerCase()
		}
	},
	createCompare : function(a, b) {
		return function(f, d) {
			var h = f.cells[a], g = d.cells[a], e = Sortable.convert(h
					.getAttribute("jspwiki:sortvalue")
					|| $getText(h), b), c = Sortable.convert(g
					.getAttribute("jspwiki:sortvalue")
					|| $getText(g), b);
			return (e < c) ? -1 : (e > c) ? 1 : 0
		}
	}
};
Wiki.addPageRender(Sortable);
var TableFilter = {
	render : function(b, a) {
		this.All = "filter.all".localize();
		this.FilterRow = 1;
		$ES(".table-filter table", b).each(
				function(f) {
					if (f.rows.length < 2) {
						return
					}
					var e = $(f.insertRow(TableFilter.FilterRow)).addClass(
							"filterrow");
					for ( var c = 0; c < f.rows[0].cells.length; c++) {
						var d = new Element("select", {
							events : {
								change : TableFilter.filter
							}
						});
						d.fcol = c;
						new Element("th").adopt(d).inject(e)
					}
					f.filterStack = [];
					TableFilter.buildEmptyFilters(f)
				})
	},
	buildEmptyFilters : function(c) {
		for ( var b = 0; b < c.rows[0].cells.length; b++) {
			var a = c.filterStack.some(function(d) {
				return d.fcol == b
			});
			if (!a) {
				TableFilter.buildFilter(c, b)
			}
		}
		if (c.zebra) {
			c.zebra()
		}
	},
	buildFilter : function(d, b, c) {
		var a = d.rows[TableFilter.FilterRow].cells[b].firstChild;
		if (!a) {
			return
		}
		a.options.length = 0;
		var f = [];
		$A(d.rows).each(function(h, g) {
			if ((g == 0) || (g == TableFilter.FilterRow)) {
				return
			}
			if (h.style.display == "none") {
				return
			}
			f.push(h)
		});
		f.sort(Sortable.createCompare(b, Sortable.guessDataType(f, b)));
		a.options[0] = new Option(this.All, this.All);
		var e;
		f.each(function(j, h) {
			var g = $getText(j.cells[b]).clean().toLowerCase();
			if (g == e) {
				return
			}
			e = g;
			a.options[a.options.length] = new Option(g.trunc(32), e)
		});
		(a.options.length <= 2) ? a.hide() : a.show();
		if (c != undefined) {
			a.value = c
		} else {
			a.options[0].selected = true
		}
	},
	filter : function() {
		var a = this.fcol, c = this.value, b = getAncestorByTagName(this,
				"table");
		if (!b || b.style.display == "none") {
			return
		}
		if (b.filterStack.every(function(e, d) {
			if (e.fcol != a) {
				return true
			}
			if (c == TableFilter.All) {
				b.filterStack.splice(d, 1)
			} else {
				e.fValue = c
			}
			return false
		})) {
			b.filterStack.push({
				fValue : c,
				fcol : a
			})
		}
		$A(b.rows).each(function(e, d) {
			e.style.display = ""
		});
		b.filterStack.each(function(g) {
			var d = g.fValue, h = g.fcol;
			TableFilter.buildFilter(b, h, d);
			var e = 0;
			$A(b.rows).each(function(j, f) {
				if ((f == 0) || (f == TableFilter.FilterRow)) {
					return
				}
				if (d != $getText(j.cells[h]).clean().toLowerCase()) {
					j.style.display = "none"
				}
			})
		});
		TableFilter.buildEmptyFilters(b)
	}
};
Wiki.addPageRender(TableFilter);
var Categories = {
	render : function(b, a) {
		$ES(".category a.wikipage", b)
				.each(
						function(e) {
							var g = Wiki.getPageName(e.href);
							if (!g) {
								return
							}
							var d = new Element("span").injectBefore(e)
									.adopt(e), c = new Element("div", {
								"class" : "categoryPopup"
							}).inject(d), f = c.effect("opacity", {
								wait : false
							}).set(0);
							e
									.addClass("categoryLink")
									.setProperties({
										href : "#",
										title : "category.title".localize(g)
									})
									.addEvent(
											"click",
											function(h) {
												new Event(h).stop();
												new Ajax(
														Wiki.TemplateUrl
																+ "AJAXCategories.jsp",
														{
															postBody : "&page="
																	+ g,
															update : c,
															onComplete : function() {
																e
																		.setProperty(
																				"title",
																				"")
																		.removeEvent(
																				"click");
																d
																		.addEvent(
																				"mouseover",
																				function(
																						i) {
																					f
																							.start(0.9)
																				})
																		.addEvent(
																				"mouseout",
																				function(
																						i) {
																					f
																							.start(0)
																				});
																c
																		.setStyle(
																				"left",
																				e
																						.getPosition().x);
																c
																		.setStyle(
																				"top",
																				e
																						.getPosition().y + 16);
																f.start(0.9);
																$ES(
																		"li,div.categoryTitle",
																		c)
																		.each(
																				function(
																						i) {
																					i
																							.addEvent(
																									"mouseout",
																									function() {
																										this
																												.removeClass("hover")
																									})
																							.addEvent(
																									"mouseover",
																									function() {
																										this
																												.addClass("hover")
																									})
																				})
															}
														}).request()
											})
						})
	}
};
Wiki.addPageRender(Categories);
var ZebraTable = {
	render : function(b, a) {
		$ES("*[class^=zebra]", b)
				.each(
						function(g) {
							var e = g.className.split("-"), f = e[1]
									.test("table"), d = "", c = "";
							if (e[1]) {
								d = new Color(e[1], "hex")
							}
							if (e[2]) {
								c = new Color(e[2], "hex")
							}
							$ES("table", g).each(function(h) {
								h.zebra = this.zebrafy.pass([ f, d, c ], h);
								h.zebra()
							}, this)
						}, this)
	},
	zebrafy : function(d, c, b) {
		var a = 0;
		$A($T(this).rows).each(function(f, e) {
			if (e == 0 || (f.style.display == "none")) {
				return
			}
			if (d) {
				(a++ % 2) ? $(f).addClass("odd") : $(f).removeClass("odd")
			} else {
				$(f).setStyle("background-color", (a++ % 2) ? c : b)
			}
		})
	}
};
Wiki.addPageRender(ZebraTable);
var HighlightWord = {
	onPageLoad : function() {
		var a = Wiki.prefs.get("PrevQuery");
		Wiki.prefs.set("PrevQuery", "");
		if (!a && document.referrer.test("(?:\\?|&)(?:q|query)=([^&]*)", "g")) {
			a = RegExp.$1
		}
		if (!a) {
			return
		}
		var b = decodeURIComponent(a).stripScripts();
		b = b.replace(/\+/g, " ");
		b = b.replace(/\s+-\S+/g, "");
		b = b.replace(/([\(\[\{\\\^\$\|\)\?\*\.\+])/g, "\\$1");
		b = b.trim().split(/\s+/).join("|");
		this.reMatch = new RegExp("(" + b + ")", "gi");
		this.walkDomTree($("pagecontent"))
	},
	walkDomTree : function(c) {
		if (!c) {
			return
		}
		for ( var g = null, e = c.firstChild; e; e = g) {
			g = e.nextSibling;
			this.walkDomTree(e)
		}
		if (c.nodeType != 3) {
			return
		}
		if (c.parentNode.className == "searchword") {
			return
		}
		var b = c.innerText || c.textContent || "";
		b = b.replace(/</g, "&lt;");
		if (!this.reMatch.test(b)) {
			return
		}
		var a = new Element("span").setHTML(b.replace(this.reMatch,
				"<span class='searchword'>$1</span>"));
		var d = document.createDocumentFragment();
		while (a.firstChild) {
			d.appendChild(a.firstChild)
		}
		c.parentNode.replaceChild(d, c)
	}
};
window.addEvent("load", function() {
	Wiki.onPageLoad();
	SearchBox.onPageLoad();
	HighlightWord.onPageLoad();
	Wiki.setFocus()
});