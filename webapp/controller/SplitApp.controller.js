sap.ui.define([
		"sap/ui/demo/masterdetail/controller/BaseController",
		"sap/ui/model/json/JSONModel"
	], function (BaseController, JSONModel) {
		"use strict";

		return BaseController.extend("sap.ui.demo.masterdetail.controller.SplitApp", {

			onInit : function () {
				var oViewModel,
					fnSetAppNotBusy,
					oListSelector = this.getOwnerComponent().oListSelector,
					iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

				oViewModel = new JSONModel({
					busy : true,
					delay : 0
				});
				this.setModel(oViewModel, "appView");

				fnSetAppNotBusy = function() {
					oViewModel.setProperty("/busy", false);
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				};

				var deviceModel = new sap.ui.model.json.JSONModel({
				            isTouch : sap.ui.Device.support.touch,
				            isNoTouch : !sap.ui.Device.support.touch,
				            isPhone : sap.ui.Device.system.phone,
				            isNoPhone : !sap.ui.Device.system.phone,
				            listMode : sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
				            listItemType : sap.ui.Device.system.phone ? "Active" : "Inactive",
				            splitMode : sap.ui.Device.system.phone ? "HideMode" : "HideMode"
				        });
				deviceModel.setDefaultBindingMode("OneWay");
				this.setModel(deviceModel, "device");
				        
				this.getOwnerComponent().getModel().metadataLoaded()
						.then(fnSetAppNotBusy);

				// Makes sure that master view is hidden in split app
				// after a new list entry has been selected.
				oListSelector.attachListSelectionChange(function () {
					this.byId("idAppControl").hideMaster();
				}, this);

				// apply content density mode to root view
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			}

		});

	}
);