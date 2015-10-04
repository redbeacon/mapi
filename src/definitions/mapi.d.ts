declare module mapi {
  interface EndpointResponse {
    response: any;
    status: number;
  }

  interface EndpointDetails {
    GET: mapi.EndpointResponse;
    POST: mapi.EndpointResponse;
    PUT: mapi.EndpointResponse;
    DELETE: mapi.EndpointResponse;
    OPTIONS: mapi.EndpointResponse;
    [method: string]: mapi.EndpointResponse;
  }

  interface EndpointMap {
    [url: string]: mapi.EndpointDetails;
  }

  interface MapSearchResult {
    url?: string;
    fixture?: string;
    status?: number;
    notFound?: boolean;
  }
}
