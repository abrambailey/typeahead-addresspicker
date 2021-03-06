(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.AddressPicker = (function(_super) {
    __extends(AddressPicker, _super);

    function AddressPicker(options) {
      if (options == null) {
        options = {};
      }
      this.markerDragged = __bind(this.markerDragged, this);
      this.updateMap = __bind(this.updateMap, this);
      this.options = $.extend({
        local: [],
        datumTokenizer: function(d) {
          return Bloodhound.tokenizers.whitespace(d.num);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        autocompleteService: {
          types: ["geocode"]
        },
        zoomForLocation: 16,
        draggable: true,
        reverseGeocoding: false
      }, options);
      AddressPicker.__super__.constructor.call(this, this.options);
      if (this.options.map) {
        this.initMap(this.options.map);
      }
    }

    AddressPicker.prototype.bindDefaultTypeaheadEvent = function(typeahead) {
      typeahead.bind("typeahead:selected", this.updateMap);
      return typeahead.bind("typeahead:cursorchanged", this.updateMap);
    };

    AddressPicker.prototype.initMap = function(options) {
      options = $.extend({
        zoom: 3,
        center: new google.maps.LatLng(0, 0),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        displayMarker: false
      }, options);
      this.map = new google.maps.Map($(options.id)[0], options);
      this.lastResult = null;
      this.marker = new google.maps.Marker({
        position: options.center,
        map: this.map,
        visible: options.displayMarker,
        draggable: this.options.draggable
      });
      if (this.options.draggable) {
        google.maps.event.addListener(this.marker, 'dragend', this.markerDragged);
      }
      return this.placeService = new google.maps.places.PlacesService(this.map);
    };

    AddressPicker.prototype.get = function(query, cb) {
      var service;
      service = new google.maps.places.AutocompleteService();
      this.options.autocompleteService.input = query;
      return service.getPlacePredictions(this.options.autocompleteService, function(predictions) {
        var data, suggestion;
        data = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = predictions.length; _i < _len; _i++) {
            suggestion = predictions[_i];
            _results.push(suggestion);
          }
          return _results;
        })();
        return cb(data);
      });
    };

    AddressPicker.prototype.updateMap = function(event, place) {
      return this.placeService.getDetails(place, (function(_this) {
        return function(response) {
          _this.marker.setPosition(response.geometry.location);
          _this.marker.setVisible(true);
          _this.lastResult = new AddressPickerResult(response);
          $(_this).trigger('addresspicker:selected', _this.lastResult);
          if (response.geometry.viewport) {
            return _this.map.fitBounds(response.geometry.viewport);
          } else {
            _this.map.setCenter(response.geometry.location);
            return _this.map.setZoom(_this.options.zoomForLocation);
          }
        };
      })(this));
    };

    AddressPicker.prototype.markerDragged = function() {
      if (this.options.reverseGeocoding) {
        return this.reverseGeocode(this.marker.getPosition());
      } else {
        if (this.lastResult) {
          this.lastResult.setLatLng(this.marker.getPosition().lat(), this.marker.getPosition().lng());
        } else {
          this.lastResult = new AddressPickerResult({
            geometry: {
              location: this.marker.getPosition()
            }
          });
        }
        return $(this).trigger('addresspicker:selected', this.lastResult);
      }
    };

    AddressPicker.prototype.reverseGeocode = function(position) {
      if (this.geocoder == null) {
        this.geocoder = new google.maps.Geocoder();
      }
      return this.geocoder.geocode({
        location: position
      }, (function(_this) {
        return function(results) {
          if (results && results.length > 0) {
            _this.lastResult = new AddressPickerResult(results[0]);
            return $(_this).trigger('addresspicker:selected', _this.lastResult);
          }
        };
      })(this));
    };

    AddressPicker.prototype.getGMap = function() {
      return this.map;
    };

    AddressPicker.prototype.getGMarker = function() {
      return this.marker;
    };

    return AddressPicker;

  })(Bloodhound);

  this.AddressPickerResult = (function() {
    function AddressPickerResult(placeResult) {
      this.placeResult = placeResult;
      this.latitude = this.placeResult.geometry.location.lat();
      this.longitude = this.placeResult.geometry.location.lng();
    }

    AddressPickerResult.prototype.addressTypes = function() {
      var component, type, types, _i, _j, _len, _len1, _ref, _ref1;
      types = [];
      _ref = this.addressComponents();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        component = _ref[_i];
        _ref1 = component.types;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          type = _ref1[_j];
          if (types.indexOf(type) === -1) {
            types.push(type);
          }
        }
      }
      return types;
    };

    AddressPickerResult.prototype.addressComponents = function() {
      return this.placeResult.address_components || [];
    };

    AddressPickerResult.prototype.address = function() {
      return this.placeResult.formatted_address;
    };

    AddressPickerResult.prototype.nameForType = function(type, shortName) {
      var component, _i, _len, _ref;
      if (shortName == null) {
        shortName = false;
      }
      _ref = this.addressComponents();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        component = _ref[_i];
        if (component.types.indexOf(type) !== -1) {
          return (shortName ? component.short_name : component.long_name);
        }
      }
      return null;
    };

    AddressPickerResult.prototype.lat = function() {
      return this.latitude;
    };

    AddressPickerResult.prototype.lng = function() {
      return this.longitude;
    };

    AddressPickerResult.prototype.setLatLng = function(latitude, longitude) {
      this.latitude = latitude;
      this.longitude = longitude;
    };

    AddressPickerResult.prototype.isAccurate = function() {
      return !this.placeResult.geometry.viewport;
    };

    return AddressPickerResult;

  })();

}).call(this);
