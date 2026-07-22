"use client";

import type { SubmitEventHandler, ReactNode } from "react";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import ErrorAlert from "./ErrorAlert";

/** โครงหน้า auth (login/register): การ์ดกลางจอ + ฟอร์ม + ปุ่ม submit + footer */
export default function AuthCard({
  title,
  subtitle,
  error,
  pending,
  submitLabel,
  onSubmit,
  footer,
  children,
}: Readonly<{
  title: string;
  subtitle: string;
  error: unknown;
  pending: boolean;
  submitLabel: string;
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  footer: ReactNode;
  children: ReactNode;
}>) {
  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, textAlign: "center" }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
          {subtitle}
        </Typography>

        <ErrorAlert error={error} />

        <Box
          component="form"
          noValidate
          onSubmit={onSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {children}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={pending}
          >
            {submitLabel}
          </Button>
        </Box>

        <Typography sx={{ mt: 3, textAlign: "center" }} color="text.secondary">
          {footer}
        </Typography>
      </Paper>
    </Container>
  );
}
