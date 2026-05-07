CREATE TABLE public."User" (
    user_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_name varchar(100) NOT NULL,
    user_role varchar(50) NOT NULL,
    password_hash varchar(255) NOT NULL
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

CREATE TABLE public."FaultReport" (
    fault_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fault_type varchar(100) NOT NULL,
    location varchar(255) NOT NULL,
    severity varchar(50) NOT NULL,
    status varchar(50) NOT NULL,
    notes text,
    marker_pattern varchar(50),
    risk_score numeric(6, 2) DEFAULT 50.0,
    weather_condition varchar(60),
    asset_area varchar(120),
    date_reported timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_engineer varchar(120),
    days_to_resolve numeric(8, 2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."AuditLog" (
    audit_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id integer,
    action varchar(80) NOT NULL,
    resource varchar(120),
    detail jsonb,
    ip_address varchar(64),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES public."User"(user_id)
);
