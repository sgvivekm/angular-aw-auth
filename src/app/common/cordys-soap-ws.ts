import {Injectable} from '@angular/core';
import {Inject} from '@angular/core';
import {Router} from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ErrorHandler } from '../dialogs/error-handler/error-handler';
// import { ConfirmDialog } from '../dialogs/confirmDialog/confirmDialog';
import { HttpHandler, HttpClient } from '@angular/common/http';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

//import 'rxjs/add/operator/map';

declare var jQuery:any;
declare var Rx: any;

@Injectable({
	providedIn: 'root',
  })

export class CordysSoapWService {
	public static GATEWAY_URL:string = "";
    public static ERROR=false;
    public static MODE="APP";
	public static taskIdenfier:string  = "";
	public static bravaPreviewUrl:string  = "";
	public static bravaPreviewUrlForOthers:string  = "";
	public tid;
	public sc_itmno:any[] = [];
	public so_itmno:any[] = [];
	public salesOrderNumber;
	public loginUserId;

	constructor(private route: ActivatedRoute, private _router: Router,private http:HttpClient, public dialog: MatDialog){
		this.route.queryParams.subscribe(params => {
			this.tid = params['tid'];
		   });
	}

	// confirmDialog(msg, result): void {
	// 	const message = msg;
	
	// 	const dialogData = new ConfirmDialogModel("Confirm Action", message);
	
	// 	const dialogRef = this.dialog.open(ConfirmDialog, {
	// 	  maxWidth: "400px",
	// 	  data: dialogData
	// 	});
	
	// 	dialogRef.afterClosed().subscribe(dialogResult => {
	// 		result(dialogResult);
	// 	});
	//   }

	setsc_itmno(itemnos){
		this.sc_itmno = itemnos;
	}

	setso_itmno(itemnos){
		this.so_itmno = itemnos;
	}
	
	//error handler popup by Venu
	public errorHandlerModal(data){
		const dialogRef = this.dialog.open(ErrorHandler, {
		  width: '100%',
		  data: data
	  	});
	  dialogRef.afterClosed().subscribe(result => {
		//this.router.navigate(['/so_details', { "tid": result.transcationNo, "sno":"1" }]);
	   });
	  }

	
	public static setMode(mode){
		CordysSoapWService.MODE = mode;		
		//jQuery.cordys.setMode(mode);
	}
	
	public static getMode(){
		return CordysSoapWService.MODE;
	}
	public static setTaskIdenfier(taIdefiner){
		CordysSoapWService.taskIdenfier = taIdefiner;		
		//jQuery.cordys.setMode(mode);
	}
	
	public  getTaskIdenfier(){
		return CordysSoapWService.taskIdenfier;
	}

	public static setBravaPreviewUrl(bravaPreviewUrl)
	{
		CordysSoapWService.bravaPreviewUrl = bravaPreviewUrl;	
	}

	public static getBravaPreviewUrl()
	{
		return CordysSoapWService.bravaPreviewUrl;
	}

	public static setBravaPreviewUrlForOthers(bravaPreviewUrl)
	{
		CordysSoapWService.bravaPreviewUrl = bravaPreviewUrl;	
	}

	public static getBravaPreviewUrlForOthers()
	{
		return CordysSoapWService.bravaPreviewUrl;
	}
	
	public static setGateWayURL(url){
		if(CordysSoapWService.GATEWAY_URL.search("&SAMLart") > 0){
			//CordysSoapWService.GATEWAY_URL = CordysSoapWService.GATEWAY_URL;
			//CordysSoapWService.clearSAMLFromGateWayURL();
			CordysSoapWService.GATEWAY_URL =	CordysSoapWService.getGateWayURL().split("&SAMLart=")[0]+"&SAMLart="+this.getCookieByName("devinst_SAMLart");

		}else{
			CordysSoapWService.GATEWAY_URL = url;
		}
		//CordysSoapWService.GATEWAY_URL = url;
	}
	
	public static setGateWayURLWithSAML(){
		
			CordysSoapWService.setGateWayURL(CordysSoapWService.getGateWayURL()+"&SAMLart="+this.getCookieByName("devinst_SAMLart"));
	
		}
	public static getCookieByName(cname) {
		let name = cname + "=";
		let allCookie = document.cookie.split(';');
		for (let eachCookie of allCookie) {
			while (eachCookie.charAt(0) == ' ') {
				eachCookie = eachCookie.substring(1);
			}
			if (eachCookie.indexOf(name) == 0) {
				return eachCookie.substring(name.length, eachCookie.length);
			}
		}
		return "";
	}
	public static clearSAMLFromGateWayURL(){
		let url = CordysSoapWService.getGateWayURL().split("&SAMLart=")[0];
		CordysSoapWService.setGateWayURL(url);
	}
	
	public static getGateWayURL(){
		return CordysSoapWService.GATEWAY_URL;
	}
	
	
	initGateWayInfo() {
		return new Observable((observer: any) => {
			if (CordysSoapWService.getGateWayURL() == null || CordysSoapWService.getGateWayURL() == "") {
				this.http.get("assets/config/server.config.txt").subscribe(data =>{
					CordysSoapWService.setGateWayURL(data["endPointURL"]);
					CordysSoapWService.setMode(data["mode"]);
					CordysSoapWService.setTaskIdenfier(data["taskIdfenifer"]);
					observer.next("");
				  });
				
			}
			else
				observer.next("");
		});
	}

    public callCordysSoapService(methodname:string,namespace:string,parameters:any,successHandler,errorHandler,isAsync,extraParams){
        let response = null;
		jQuery.cordys.json.defaults.removeNamespacePrefix=true;
        var compRef = this;
		if(CordysSoapWService.getGateWayURL() != null && CordysSoapWService.getGateWayURL() != ""){
			response = this.fireCordysSoapService(methodname,namespace,parameters,successHandler,errorHandler,isAsync,extraParams,compRef);
		}else{
			this.initGateWayInfo().subscribe((data) => {
				response = this.fireCordysSoapService(methodname,namespace,parameters,successHandler,errorHandler,isAsync,extraParams,compRef);
			});
		}
		return 	response;
    }
	
	public fireCordysSoapService(methodname:string,namespace:string,parameters:any,successHandler,errorHandler,isAsync,extraParams,compRef){
		return jQuery.cordys.ajax({
            method: methodname,
            namespace: namespace,
            url: CordysSoapWService.getGateWayURL(),
            async:isAsync,
            parameters: parameters,
            success: function(data) {
                ////console.log('Success Response received for the webservice call' + data)
                if(successHandler)successHandler(data,extraParams);
                },
            error:function(response,status,errorText) {
                var responseText = response.responseText || "";
                if (responseText.search(/(AccessDenied|Artifact_Unbound|Forbidden|invalidCredentials|userDisabled)/i) >= 0) {
                    let serverUrl = CordysSoapWService.getGateWayURL().split('/cordys/')[0];
                    window.location.href = serverUrl + "/cordys/html5/login.htm";
                    return;
                }
                if(errorHandler)errorHandler(response,status,errorText,extraParams);
            }
        }).fail(function(error) { 
            var responseText = error.responseText || "";
            if (responseText.search(/(AccessDenied|Artifact_Unbound|Forbidden|invalidCredentials|userDisabled)/i) >= 0 || error.status === 401 || error.status === 403) {
                CordysSoapWService.ERROR = true;
                let serverUrl = CordysSoapWService.getGateWayURL().split('/cordys/')[0];
                window.location.href = serverUrl + "/cordys/html5/login.htm";
            }
        });
	}

    public responseResolver(data:any, businessObject:string) {
        return jQuery.map(jQuery.makeArray(data.tuple),function(tuple, index) {
            return tuple.old[businessObject];
        });
    }
    
    public httpget(url: string) {
	 // return this.http.get(url).map(res => res.json());
	   return this.http.get(url);
    }
	
	public httppost(url:string,request,contentType:string){       
       
      
	}
	
	public getLOVData(request,resultMap,tableMap){
		
	}
    
}