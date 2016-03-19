import { IOauthProvider } from "../oauth";
import { OauthUtility } from "../utility";

declare var window: any;
const PROVIDER_NAME = "Facebook";

/*
 * Configuration options for using Facebook oauth
 */
export interface IFacebookOptions {
    clientId?: String;
    appScope?: Array<String>;
    appResponseType?: String;
    state?: String;
    redirectUri?: String;
    authType?: String;
}

export class Facebook implements IOauthProvider {

    facebookOptions: IFacebookOptions;
    flowUrl: String;

    constructor(options: IFacebookOptions={}) {
        if(!options.clientId || options.clientId == "") {
            throw Error("A " + PROVIDER_NAME + " client id must exist");
        }
        if(!options.appScope || options.appScope.length <= 0) {
            throw Error("A " + PROVIDER_NAME + " app scope must exist");
        }
        if (!options.appResponseType || options.appResponseType.length <= 0) {
            options.appResponseType = "token";
        }
        this.facebookOptions = options;
        this.facebookOptions.redirectUri = options.hasOwnProperty("redirectUri") ? options.redirectUri : "http://localhost/callback";
        this.flowUrl = "https://www.facebook.com/v2.0/dialog/oauth?client_id=" + this.facebookOptions.clientId + "&redirect_uri=" + this.facebookOptions.redirectUri 
        this.flowUrl += "&response_type=" + options.appResponseType +"&scope=" + this.facebookOptions.appScope.join(",");
        if (options !== undefined && options.hasOwnProperty("state")) {
            this.flowUrl += "&state=" + options.state;
        }
        if (options !== undefined && options.hasOwnProperty("authType")) {
            this.flowUrl += "&auth_type=" + options.authType;
        }
    }

    login() {
        return new Promise((resolve, reject) => {
            var browserRef = window.cordova.InAppBrowser.open(this.flowUrl, "_blank", "location=no,clearsessioncache=yes,clearcache=yes");
            browserRef.addEventListener("loadstart", (event) => {
                if ((event.url).indexOf(this.facebookOptions.redirectUri) === 0) {
                    browserRef.removeEventListener("exit", (event) => {});
                    browserRef.close();
                    if ((event.url).indexOf("access_token=") > 0) {
                        var parsedResponse = (new OauthUtility()).parseImplicitResponse(((event.url).split("#")[1]).split("&"));
                    } else if ((event.url).indexOf("code=") > 0) {
                        var parsedResponse = (new OauthUtility()).parseImplicitResponse((((event.url).split("?")[1]).split("#"))[0].split("&"));
                    }
                    if (parsedResponse) {
                        resolve(parsedResponse);
                    } else {
                        reject("Problem authenticating with " + PROVIDER_NAME);
                    }
                }
            });
            browserRef.addEventListener("exit", function(event) {
                reject("The " + PROVIDER_NAME + " sign in flow was canceled");
            });
        });
    }

}
