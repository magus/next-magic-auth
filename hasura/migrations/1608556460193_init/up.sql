CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
CREATE TABLE public."loginToken" (
    "userId" uuid NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    expires timestamp with time zone NOT NULL,
    value text NOT NULL,
    "requestCookie" text NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    email text NOT NULL
);
CREATE TABLE public."refreshToken" (
    "userId" uuid NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    expires timestamp with time zone NOT NULL,
    value text NOT NULL
);
CREATE TABLE public.role (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);
CREATE TABLE public."user" (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    updated timestamp with time zone DEFAULT now() NOT NULL,
    email text NOT NULL,
    "defaultRole" text DEFAULT 'user'::text NOT NULL
);
CREATE TABLE public.user_role (
    "userId" uuid NOT NULL,
    "roleId" uuid NOT NULL
);
ALTER TABLE ONLY public."loginToken"
    ADD CONSTRAINT "loginToken_pkey" PRIMARY KEY ("userId");
ALTER TABLE ONLY public."loginToken"
    ADD CONSTRAINT "loginToken_requestCookie_key" UNIQUE ("requestCookie");
ALTER TABLE ONLY public."loginToken"
    ADD CONSTRAINT "loginToken_userId_key" UNIQUE ("userId");
ALTER TABLE ONLY public."refreshToken"
    ADD CONSTRAINT "refreshToken_pkey" PRIMARY KEY ("userId");
ALTER TABLE ONLY public."refreshToken"
    ADD CONSTRAINT "refreshToken_userId_key" UNIQUE ("userId");
ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_name_key UNIQUE (name);
ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY ("userId", "roleId");
ALTER TABLE ONLY public."loginToken"
    ADD CONSTRAINT "loginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public."refreshToken"
    ADD CONSTRAINT "refreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT "user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE CASCADE;
