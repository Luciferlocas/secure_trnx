"use client";

import { useState } from "react";
import { type TxSecureRecord, type Payload } from "@repo/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { TnxService } from "@repo/api-client";

export default function Home() {
  const [partyId, setPartyId] = useState("");
  const [payloadText, setPayloadText] = useState(
    JSON.stringify({ amount: 100, currency: "AED" }, null, 2)
  );
  const [record, setRecord] = useState<TxSecureRecord | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [decrypted, setDecrypted] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState<
    "encrypt" | "decrypt" | "get" | null
  >(null);

  const parsePayloadSafely = (): Payload | null => {
    try {
      return JSON.parse(payloadText);
    } catch {
      return null;
    }
  };

  const handleEncrypt = async () => {
    setLoading("encrypt");
    setError(null);
    setRecord(null);
    setDecrypted(null);

    const parsedPayload = parsePayloadSafely();
    if (!parsedPayload) {
      setError("Invalid JSON format in payload");
      setLoading(null);
      return;
    }

    try {
      const { success, data, error } =
        await TnxService.encryptTransaction({
          partyId,
          payload: parsedPayload,
        });

      if (success) {
        setRecord(data);
        setTransactionId(data?.id || "");
      } else {
        setError(error?.error as string);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred"
      );
    } finally {
      setLoading(null);
    }
  };

  const handleDecrypt = async () => {
    if (!record) return;

    setLoading("decrypt");
    setError(null);
    setDecrypted(null);

    try {
      const { success, data, error } =
        await TnxService.decryptTransaction({
          id: transactionId,
        });

        console.log(error, success, data)

      if (success) {
        setDecrypted(data);
      } else {
        setError(error?.error as string);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred"
      );
    } finally {
      setLoading(null);
    }
  };

  const getTransaction = async () => {
    if (!transactionId.trim()) return;

    setLoading("get");
    setError(null);

    try {
      const { success, data, error } =
        await TnxService.getTransactionById({
          id: transactionId,
        });

      if (success) {
        setRecord(data);
      } else {
        setError(error?.error as string);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred"
      );
    } finally {
      setLoading(null);
    }
  };

  const parsedPreview = parsePayloadSafely();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Secure Transaction Service
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Encrypt and decrypt sensitive payloads securely.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Create Transaction</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Party ID
                </label>
                <Input
                  value={partyId}
                  onChange={(e) =>
                    setPartyId(e.target.value)
                  }
                  placeholder="e.g., party_123"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Payload
                </label>
                <Textarea
                  value={payloadText}
                  rows={6}
                  onChange={(e) =>
                    setPayloadText(e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  JSON Preview
                </label>
                <div className="bg-slate-100 dark:bg-slate-900 rounded-md p-4 font-mono text-sm overflow-auto max-h-48">
                  <pre className="whitespace-pre-wrap break-words">
                    {parsedPreview
                      ? JSON.stringify(
                          { partyId, payload: parsedPreview },
                          null,
                          2
                        )
                      : "Invalid JSON"}
                  </pre>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                onClick={handleEncrypt}
                disabled={loading !== null}
                className="w-full"
              >
                {loading === "encrypt"
                  ? ". . ."
                  : "Encrypt"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Transaction ID
                </label>
                <div className="flex gap-2">
                  <Input
                  placeholder="e.g., aa466b4b-8baa-491d-a0a7-2371a43ef582"
                    value={transactionId}
                    onChange={(e) =>
                      setTransactionId(
                        e.target.value
                      )
                    }
                  />
                  <Button
                    onClick={getTransaction}
                    disabled={
                      loading !== null ||
                      !transactionId.trim()
                    }
                  >
                    {loading === "get"
                      ? ". . ."
                      : "Get"}
                  </Button>
                </div>
              </div>

              {record && (
                <>
                  <pre className="bg-slate-100 dark:bg-slate-900 rounded-md p-4 font-mono text-xs overflow-auto max-h-48">
                    {JSON.stringify(record, null, 2)}
                  </pre>

                  {decrypted && (
                    <div className="space-y-2"> <label className="text-sm text-green-700 font-medium"> Decrypted Payload </label> <pre className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-md p-4 font-mono text-xs overflow-auto max-h-48"> {JSON.stringify(decrypted, null, 2)} </pre> </div>
                  )}

                  <Button
                    onClick={handleDecrypt}
                    disabled={loading !== null}
                    className="w-full"
                  >
                    {loading === "decrypt"
                      ? ". . ."
                      : "Decrypt"}
                  </Button>
                </>
              )}
              {error && (
          <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50 border">
            <span className="font-medium">
              Error:
            </span>{" "}
            {error}
          </div>
        )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
