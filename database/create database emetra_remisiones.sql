create table public.cruise
(
    id          serial
        primary key,
    cruise_name varchar not null
);

alter table public.cruise
    owner to muniadmin;

create table public.photo_status
(
    id          integer default nextval('photo_status_id_seq'::regclass) not null
        primary key,
    description varchar                                                  not null
);

alter table public.photo_status
    owner to muniadmin;

create table public.role
(
    id          serial
        primary key,
    name        varchar not null
        constraint "UQ_ae4578dcaed5adff96595e61660"
            unique,
    description varchar not null
);

alter table public.role
    owner to muniadmin;

create table public.user_e
(
    id       serial
        primary key,
    role_id  integer
        constraint "FK_c4f3695676e9773a890274f19c7"
            references public.role,
    username varchar not null
        constraint "UQ_0b1d504a43d5eecd6041340f356"
            unique,
    password varchar not null,
    email    varchar not null
        constraint "UQ_dfd277e6370989d8732bfa42f51"
            unique
);

alter table public.user_e
    owner to muniadmin;

create table public.photo
(
    id              serial
        primary key,
    id_cruise       integer                     not null
        constraint "FK_e8d953bfb8a752c0525856bde38"
            references public.cruise,
    id_photo_status integer default 0           not null
        constraint fk_photo_status
            references public.photo_status,
    locked_by       integer,
    locked_at       timestamp,
    photo_date      timestamp                   not null,
    photo_name      varchar                     not null,
    photo_path      varchar                     not null,
    photo_info      jsonb   default '{}'::jsonb not null
);

alter table public.photo
    owner to muniadmin;

create table public.rejection_reason
(
    id          serial
        primary key,
    description varchar not null
);

alter table public.rejection_reason
    owner to muniadmin;

create table public.photo_processing
(
    id              serial
        primary key,
    id_photo        integer     not null
        constraint fk_photo_processing_photo
            references public.photo,
    id_user         integer     not null
        constraint fk_photo_processing_user
            references public.user_e,
    start_time      timestamp   not null,
    end_time        timestamp,
    processing_type varchar(20) not null
        constraint photo_processing_processing_type_check
            check ((processing_type)::text = ANY
                   ((ARRAY ['success'::character varying, 'rejected'::character varying])::text[]))
);

alter table public.photo_processing
    owner to muniadmin;

create table public.photo_success
(
    id                  serial
        primary key,
    processing_id       integer not null
        constraint fk_photo_success_processing
            references public.photo_processing
            on delete cascade,
    traffic_fine_id     integer,
    speed_event_payload jsonb
);

alter table public.photo_success
    owner to muniadmin;

create table public.photo_rejection
(
    id                  serial
        primary key,
    processing_id       integer not null
        constraint fk_photo_rejection_processing
            references public.photo_processing
            on delete cascade,
    rejection_reason_id integer not null
        constraint fk_photo_rejection_reason
            references public.rejection_reason
);

alter table public.photo_rejection
    owner to muniadmin;

