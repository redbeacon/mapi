declare module mapi {
  interface EndpointResponse {
    response: any;
    status: number;
  }

  interface EndpointDetails {
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
