"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { useI18n } from "@family/i18n/react";
import { Alert, AlertDescription } from "@family/ui/components/alert";
import { Button } from "@family/ui/components/button";
import { Card, CardContent } from "@family/ui/components/card";
import { Input } from "@family/ui/components/input";
import { Label } from "@family/ui/components/label";
import { loginAction } from "@/lib/actions";

export const LoginForm = ({ next, hint }: { next: string; hint?: string }) => {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState(loginAction, {});
  const errorText =
    state.error === "invalid"
      ? dict.admin.login.invalid
      : state.error === "notConfigured"
        ? dict.admin.login.notConfigured
        : state.error === "rateLimited"
          ? dict.common.errorDescription
          : null;

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div className="space-y-2">
            <Label htmlFor="password">{dict.admin.login.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              aria-invalid={!!errorText}
              aria-describedby={errorText ? "login-error" : undefined}
            />
          </div>
          {errorText && (
            <Alert variant="destructive" id="login-error">
              <AlertDescription>{errorText}</AlertDescription>
            </Alert>
          )}
          {hint && !errorText && <p className="text-xs text-muted-foreground">{hint}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <LogIn className="rtl:rotate-180" />}
            {dict.admin.login.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
