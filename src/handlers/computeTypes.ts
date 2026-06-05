export type ComputeRequestBody = {
  arrival: string;
};

export type ComputeSuccessResponse = {
  duration: number;
  route: string[];
};

export type ErrorResponse = {
  error: string;
};
