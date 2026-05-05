CREATE TABLE public."User" (
    user_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_name varchar(100) NOT NULL,
    user_role varchar(50) NOT NULL
);

CREATE TABLE public."ToolLog" (
    tool_log_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tool_name varchar(255) NOT NULL,
    tool_id varchar(50),
    checked_by integer NOT NULL,
    status_review varchar(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_toollog_checked_by_user
    FOREIGN KEY (checked_by)
    REFERENCES public."User"(user_id)
);
