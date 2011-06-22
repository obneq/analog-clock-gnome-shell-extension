const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Cairo = imports.cairo;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Gettext = imports.gettext.domain('gnome-shell');
const _ = Gettext.gettext;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Calendar = imports.ui.calendar;

function Clock () {
  this._init();
}

Clock.prototype = {
  _init: function() {
    this.values = [];
    this.values.push({color: "-clock-color", values: []});
    this.values.push({color: "-hours-color", values: []});
    this.values.push({color: "-mins-color", values: []});
    this.now = new Date();

    this.actor = new St.DrawingArea({style_class: 'clock-area', reactive: true});
    this.actor.connect('repaint', Lang.bind(this, this._draw));

    Mainloop.timeout_add_seconds(1, Lang.bind(this, function () {
      this.now = new Date();
      this.actor.queue_repaint();
      return true;
    }));
  },

  _draw: function(area) {
    let sec = this.now.getSeconds();
    let min = this.now.getMinutes();
    let hour = this.now.getHours();
    let [width, height] = area.get_surface_size();
    let themeNode = this.actor.get_theme_node();
    let cr = area.get_context();

    //draw clock
    let color = themeNode.get_color(this.values[0].color);
    Clutter.cairo_set_source_color(cr, color);
    
    cr.translate(Math.floor(width/2), Math.floor(height/2));   
    cr.save();
 
    cr.arc(0,0, Math.floor(height/2) - 2, 0, 7);
    cr.setLineWidth(2.5);
    cr.stroke();
    
    //hour hand
    color = themeNode.get_color(this.values[1].color);
    Clutter.cairo_set_source_color(cr, color);
    cr.setLineWidth(2.2);

    cr.rotate( (hour + sec/3600 + min/60) * Math.PI/6 + Math.PI);
    
    cr.moveTo(0,0);
    cr.lineTo(0, Math.floor(height/2)-3);
    cr.stroke();

    cr.restore();

    // minute hand
    color = themeNode.get_color(this.values[2].color);
    Clutter.cairo_set_source_color(cr, color);
    cr.setLineWidth(1.6);

    cr.rotate( (min+sec/60) * Math.PI/30 + Math.PI);
    
    cr.moveTo(0,0);
    cr.lineTo(0, Math.floor(height/2)-1);
    cr.stroke();

    cr.restore();
  }
};

function ClockButton() {
  this._init.apply(this, arguments);
}

ClockButton.prototype = {
  __proto__: PanelMenu.Button.prototype,

  _init: function() {
    let item;
    let box;
    this._eventSource = new Calendar.DBusEventSource();

    PanelMenu.Button.prototype._init.call(this, 0.5);

    box = new St.BoxLayout({vertical: true});
    this.menu.addActor(box);

    // Date and Time
    this._date = new St.Label();
    this._date.style_class = 'datemenu-date-label';
    box.add(this._date);

    // Calendar
    this._calendar = new Calendar.Calendar(this._eventSource);

    box.add(this._calendar.actor);
    this._calendar._update(true);

    this._updateMenu();

    this._clockButton = new St.BoxLayout();
    this._clockIconBox = new St.BoxLayout({ style_class: 'clock-status-icon'});

    let clock = new St.BoxLayout({ style_class: 'clock-status-icon' });
    clock.add((new Clock()).actor);

    this._clockIconBox.add_actor(clock);
    this._clockButton.add_actor(this._clockIconBox);
    this.actor.set_child(this._clockButton);
    
    let _clock    = Main.panel._dateMenu;
    Main.panel._centerBox.remove_actor(_clock.actor);

    let _children = Main.panel._rightBox.get_children();
    Main.panel._rightBox.insert_actor(this.actor, _children.length - 1);
    Main.panel._menus.addMenu(this.menu);
  },
  
 _updateMenu: function() {
        let dateFormat;
        let displayDate = new Date();

        dateFormat = _("%A %B %e, %H:%M");
        this._date.set_text(displayDate.toLocaleFormat(dateFormat));

        Mainloop.timeout_add_seconds(1, Lang.bind(this, this._updateMenu));
        return false;
    }
};

function main() {
  new ClockButton();
}
