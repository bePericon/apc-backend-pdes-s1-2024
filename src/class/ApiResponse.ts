// Class for modeling response.

export default class ApiResponse {
  private status: string;
  private data?: any;
  private error?: any;
  private code: string | number;

  constructor(status: string, code: string | number, data: any, error?: any | undefined) {
    this.status = status;
    this.code = code;
    this.data = data;
    this.error = error;
  }
}

/**
 * @swagger
 * components:
 *  schemas:
 *    ApiResponse:
 *      type: object
 *      properties:
 *        code:
 *          type: integer
 *          format: int32
 *        status:
 *          type: string
 *        error:
 *          type: string
 */
