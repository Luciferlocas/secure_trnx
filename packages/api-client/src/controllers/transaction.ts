import { APIClient } from '../core/client'
import { CreateTxInput, DecryptTxInput, ClientResponse, TxSecureRecord, GetTransactionByIdInput, Payload } from '@repo/schema'
import { parseResponse } from '../core/response-parser'

export default class TransactionController {
  private apiClient: APIClient

  constructor(private readonly backendURL: string) {
    this.apiClient = new APIClient(this.backendURL)
  }

  async encryptTransaction(request: CreateTxInput,headers?: Record<string, string>): Promise<ClientResponse<TxSecureRecord>> {
    const response = await this.apiClient.post(`/api/tx/encrypt`, request, headers)
    return parseResponse<TxSecureRecord>(response)
  }

  async decryptTransaction(request: DecryptTxInput, headers?: Record<string, string>):  Promise<ClientResponse<Payload>>  {
    const response = await this.apiClient.post(`/api/tx/${request.id}/decrypt`, {}, headers)
    return parseResponse<Payload>(response)
  }

  async getTransactionById(request: GetTransactionByIdInput, headers?: Record<string, string>): Promise<ClientResponse<TxSecureRecord>> {
    const response = await this.apiClient.get(`/api/tx/${request.id}`, headers)
    return parseResponse<TxSecureRecord>(response)
  }
}
