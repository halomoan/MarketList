/*global location */
sap.ui.define([
		"sap/ui/demo/masterdetail/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/demo/masterdetail/model/formatter"
	], function (BaseController, JSONModel, formatter) {
		"use strict";

		return BaseController.extend("sap.ui.demo.masterdetail.controller.DMarketList", {
			formatter: formatter,
			
			onInit : function () {
			    
			    sap.ui.getCore().getEventBus().subscribe("marketlist","addMaterial",this._addMaterial,this);
			    
			    this._cData = {
			    	Dates : [],
			    	tableChanged : true
			    	
			    };
			    
				var oViewData = {
					toogleFreeze : false,
					freezeCol : 4,
					columns : [
							{"noItem": 1 , "total" : 0, "visible": true},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 1 , "total" : 0, "visible": true},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false}
						]
				};
				
				var aSelectionItems = [];
				var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
				var sDay = this.getResourceBundle().getText("day");
				
				for(var i = 1; i <= 7; i++) {
					if (sCurrentLocale.startsWith("en")){
						var sShowDay = (i > 1) ? sDay + "s": sDay;
					}
					aSelectionItems.push({key: (i + "Day"), text: this.getResourceBundle().getText(i) + " " +  sShowDay});
				}
				
				oViewData.noOfDays = aSelectionItems;

				var oViewModel = new JSONModel(oViewData);
				this.setModel(oViewModel, "detailView");
				
				
				this._oModel = this.getOwnerComponent().getModel();
				
				
				this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			},
			
			onExit:function(){
				
				sap.ui.getCore().getEventBus().unsubscribe("marketlist","addMaterial",this._addMaterial,this);
			},
			
			toggleFreeze: function(){
				
				var oViewModel = this.getModel("detailView"),
				    toogleFreeze = oViewModel.getProperty("/toogleFreeze"),
				    freezeCol =  oViewModel.getProperty("/freezeCol");
				if(toogleFreeze){
					this.byId("mktlistTable").setFixedColumnCount(freezeCol);   
				} else{
					this.byId("mktlistTable").setFixedColumnCount(0);
					 oViewModel.setProperty("/freezeCol",4);
				}   
				
			},
			
			addCommentPress: function(oEvent){
				var text = oEvent.getSource().data("myText");
				var sId = oEvent.getSource().data("myId");
				var sComment = oEvent.getSource().data("myComment");
				var oModel = this._oJsonModel;
			
				var itemId = sId.substr(0,sId.length - 3);
				var itemIdx = parseInt(sId.slice(-2));
				
				var dialog = new sap.m.Dialog({
					title: this.getResourceBundle().getText("addComment") + " " + text + " (" + itemId + ")" ,
					type: 'Message',
					content: [
							new sap.m.TextArea('commentTextArea', {
								width: '100%',
								placeholder: 'Add comment (optional)',
								value : sComment
							})
						],
						beginButton: new sap.m.Button({
							text:  this.getResourceBundle().getText("submit"),
							press: function () {
								var sText = sap.ui.getCore().byId('commentTextArea').getValue();
								sap.m.MessageToast.show('Add Comment : ' + sText);
								var rows = oModel.getData().rows;
								for(var key in rows) {
									if (rows[key].MaterialID === itemId){
										rows[key].Items[itemIdx].Comment = sText;
										oModel.refresh();
										break;
									}
								}
								
								dialog.close();
							}
						}),
						endButton: new sap.m.Button({
							text: this.getResourceBundle().getText("cancel"),
							press: function () {
								dialog.close();
							}
						}),
						afterClose: function() {
							dialog.destroy();
						}
				});

				dialog.open();
			},
			
			onSubmit: function() {
				if (!this._oViewFormSubmit) {
					this._oViewFormSubmit = sap.ui.xmlfragment("sap.ui.demo.masterdetail.view.submitForm", this);
					this.getView().addDependent(this._oViewFormSubmit);
					// forward compact/cozy style into Dialog
					this._oViewFormSubmit.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				}
				
				
				this._oViewFormSubmit.open();
			},
			
			doSaveData: function() {
				
			},
			closeSaveDialog: function() {
				if (this._oViewFormSubmit) {
					this._oViewFormSubmit.close();
				}
			},
			onClose: function(){
				sap.ui.getCore().byId("__component0---app--idAppControl").hideMaster();
				this.getRouter().navTo("home", null, false);
			},
			onRowsDelete: function() {
					var oThis = this;
					
					
					if (oThis.byId("mktlistTable").getSelectedIndex() >= 0) {
						sap.m.MessageBox.confirm(oThis.getResourceBundle().getText("confirmDelMaterial"),{
							icon: sap.m.MessageBox.Icon.INFORMATION,
							title: oThis.getResourceBundle().getText("confirm"),
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							onClose: function(oAction){
								if (oAction === sap.m.MessageBox.Action.YES) {
									oThis._deleteRows(oThis);	
								}
							}
						});
					} else{
						sap.m.MessageBox.error(oThis.getResourceBundle().getText("noSelection"), {
						    title: oThis.getResourceBundle().getText("warning"),                                     
						    onClose: null,                                       
						    styleClass: "",                                       
						    initialFocus: null,                                  
						    textDirection: sap.ui.core.TextDirection.Inherit     
						});
					}
			},
			
			_deleteRows : function(oThis) {
				var oTable = oThis.byId("mktlistTable");
				var iCount = 0;
				var tableRows = oThis._oJsonModel.getData().rows;
				
				var aIndices = oTable.getSelectedIndices();
				
				for (var i = aIndices.length - 1; i >=0; i--){
					tableRows.splice(aIndices[i],1);
					iCount++;
				}
				
				
				if(iCount > 0) {
					oTable.clearSelection();
					oThis._oJsonModel.refresh();
				}
				
				
				
			},
			
			onNoOfDaysChange : function(oEvent) {
				
				var keyItem;
				if(oEvent) {
					keyItem = oEvent.getParameter("selectedItem").getKey();
				}
				var iCols = 0;
				var oViewModel = this.getModel("detailView");
				
				this._cData.tableChanged = false;
				
				switch (keyItem){
					case "1Day": iCols = 7; break;
					case "2Day": iCols = 8; break;
					case "3Day": iCols = 9; break;
					case "4Day": iCols = 10; break;
					case "5Day": iCols = 11; break;	
					case "6Day": iCols = 12; break;
					case "7Day": iCols = 13; break;
					default:  iCols = 7; break; 
				}
				
				//Current and Future Days
				for (var i = 7; i <= 13; i++){
					if (i > iCols) {
						oViewModel.setProperty("/columns/" + i + "/visible",false);	
					} else{
						oViewModel.setProperty("/columns/" + i + "/visible",true);	
					}
					
				}
				
				// Past Days
				for (i = 0; i <= 6; i++){
					if (i > (iCols - 7)) {
						oViewModel.setProperty("/columns/" + i + "/visible",false);	
					} else{
						oViewModel.setProperty("/columns/" + i + "/visible",true);		
					}
					
				}
			
			},
			
			_onTableChanged : function(oModelJson) {
				
					
					var data = oModelJson.getProperty("/rows");
					
					
					if (data && this._cData.tableChanged) {
						
						console.log('changed');
						
						var noItems = [], totals = [];
						for(var i = 0; i < data.length; i++) {
							var arr = data[i].Items;
							for (var j = 0; j < arr.length; j++) {
								if (arr[j].Quantity > 0) {
									
									noItems[arr[j].Date] = isNaN(noItems[arr[j].Date]) ? 1 : (noItems[arr[j].Date] + 1);
								
									if (isNaN(totals[arr[j].Date])) {
										totals[arr[j].Date] = (arr[j].Quantity / data[i].PriceUnit * data[i].UnitPrice);
									}else{
										totals[arr[j].Date] = totals[arr[j].Date] + (arr[j].Quantity / data[i].PriceUnit * data[i].UnitPrice);
									}
								}
							}
						}
		
						var oViewModel = this.getModel("detailView");
						
					
						i = 0;
						for (var key in noItems) {
							oViewModel.setProperty("/columns/" + (i++) + "/noItem",noItems[key]);
						}
						
						i = 0;	
						for (key in totals) {
							oViewModel.setProperty("/columns/" + (i++) + "/total",formatter.currencyValue(totals[key]));
						}
					
						
					}
			
					this._cData.tableChanged = true;
			},
			_onMetadataLoaded: function(){
			
				
				var oTable = this.byId("mktlistTable");
				var oModelJson = new JSONModel();
				var oView = this.getView();
				var Dates = [];
		
				
			
				
				var sPath = "/" + this._oModel.createKey("MarketListHeaderSet",{MarketListHeaderID: "MKT0001"});
				
				
				this.getView().bindElement(sPath);
			
				sap.ui.core.BusyIndicator.show();
				this._oModel.read(sPath + "/MarketListDetailSet", {
				    method: "GET",
				    success: function(oData) {
				        oModelJson.setData({ rows: oData.results } );
				    	oView.setModel(oModelJson,"mktlist");
				      	oTable.bindRows("mktlist>/rows");
				      	
				      	var colHeader = oView.getModel().getProperty(sPath + "/Headers");
				      	var i = 0;
						for(var key in colHeader){
							Dates[i++] =  colHeader[key].Date;
						}
						
						sap.ui.core.BusyIndicator.hide();	
				    },
				    error: function() {
						sap.ui.core.BusyIndicator.hide();
				    }
				});
				
				
				var binding =  new sap.ui.model.Binding(oModelJson, "/rows", oModelJson.getContext("/rows"));
				binding.attachChange(function() {
						this._onTableChanged(oModelJson);
						
				}.bind(this));
				
				this._oJsonModel = oModelJson;
				this._cData.Dates = Dates;
			
			},
			
			_addMaterial: function(sChannel,sEvent,oData){
				
				
				if (oData ) {
					
					
					var tableRows = this._oJsonModel.getData().rows;
				
					
					var iCol = 0;
					var bNew = true,bAdded = false;
					for (var i = 0; i < oData.data.length; i++ ){
						
						bNew = true;
						for (var j = 0; j < tableRows.length; j++){
							if (tableRows[j].MaterialID === oData.data[i].MaterialID ){
								bNew = false;
								j = tableRows.length + 1;
							}
						}
						
						if (bNew) {
							iCol = 0;
							for(var key in oData.data[i].Items){
								oData.data[i].Items[key].Date =  this._cData.Dates[iCol++];
							}		
							tableRows.push(oData.data[i]);
							
							bAdded = true;
						} else {
							sap.m.MessageToast.show(oData.data[i].MaterialID + " - " + oData.data[i].MaterialText + " is already in the table.",{});	
						}
					}
					
					if (bAdded) {
						this._oJsonModel.refresh();
						sap.ui.getCore().byId("__component0---app--idAppControl").hideMaster();
					}
					
					
					
					
				}
			}
			
	});
});