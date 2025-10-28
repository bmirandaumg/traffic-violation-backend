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
    id          serial
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
    id_photo_status integer default 0           not null,
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
        constraint "FK_4b9ce13146d82b296d389dd48b7"
            references public.photo,
    id_user         integer     not null
        constraint "FK_f5172091e827fbc52c50844b7dc"
            references public.user_e,
    start_time      timestamp   not null,
    end_time        timestamp,
    processing_type varchar(20) not null
);

alter table public.photo_processing
    owner to muniadmin;

create table public.photo_success
(
    id                  serial
        primary key,
    processing_id       integer not null
        constraint "FK_7e2d71bc76fffc0ec631fa408cf"
            references public.photo_processing,
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
        constraint "FK_519d60cf81b8abc7e0da638cdd4"
            references public.photo_processing,
    rejection_reason_id integer not null
        constraint "FK_cf534e00ec98df73be737d29aca"
            references public.rejection_reason
);

alter table public.photo_rejection
    owner to muniadmin;

create table public.processed_photo
(
    id                  serial
        constraint "PK_519bd1c399475368cb3cc152faa"
            primary key,
    start_time          timestamp not null,
    end_time            timestamp,
    id_photo            integer
        constraint "FK_30108e78518ab41a8d18445e393"
            references public.photo,
    id_user             integer
        constraint "FK_05b7dcb660cac2e67eb288eb027"
            references public.user_e,
    id_rejection_reason integer
        constraint "FK_6f17d6344146927a4777ecfca57"
            references public.rejection_reason
);

alter table public.processed_photo
    owner to muniadmin;

create table public.photo_rejected
(
    id                  serial
        constraint "PK_c6ce3955f8bd6b1221f542ff342"
            primary key,
    "processedPhotoId"  integer not null
        constraint "FK_bc48d1c1d5662d6277dd8725768"
            references public.processed_photo,
    "rejectionReasonId" integer not null
        constraint "FK_60ee8ad572c0ee0d2e4a800c723"
            references public.rejection_reason
);

alter table public.photo_rejected
    owner to muniadmin;

INSERT INTO cruise (cruise_name) VALUES
                                        ('Columpio_V_H_Oriente_Z_15'),
                                        ('Anillo_Perferico_Sur_Z_11'),
                                        ('Anillo_Periferico_Norte_Z_7'),
                                        ('Anillo_Periferico_Sur_Z_7'),
                                        ('Atanasio_Tzul_Norte_zona_12'),
                                        ('Atanasio_Tzul_Sur_zona_12'),
                                        ('7_avenida_zona_12'),
                                        ('Av_Las_Americas_Norte_zona_14'),
                                        ('2calle_Final_Oriente_Z_10'),
                                        ('Avenida_Hincapie_Sur_Z_13');

INSERT INTO photo_status (id,description) VALUES
                                              (0,'No Procesada'),
                                              (1,'Procesada exitosamente'),
                                              (2,'Rechazada');

SELECT setval('photo_status_id_seq', COALESCE((SELECT MAX(id) FROM photo_status), 0));

INSERT INTO role (id,name,description) VALUES
                                           (1,'admin','Gestionar Usuarios'),
                                           (2,'digitador','Procesar Multas');

SELECT setval('role_id_seq', COALESCE((SELECT MAX(id) FROM role), 0));

INSERT INTO user_e (role_id, username, password, email)
VALUES (
  1,
  '43274',
  '$2b$10$cJ106y1VH1T2LmawRnz1NuCdJXvG7drli5yyDNhV.6ZnG./8mVU.a',
  'admin@emetra.com'
);

SELECT setval('user_e_id_seq', COALESCE((SELECT MAX(id) FROM user_e), 0));

insert into rejection_reason (description) values
                                               ('Información de placa no coincide'),
                                               ('Vehículo sin placa'),
                                               ('Imagen sin Información'),
                                               ('Información de placa faltante');
ALTER TABLE public.photo
  ADD CONSTRAINT fk_photo_status
  FOREIGN KEY (id_photo_status)
  REFERENCES public.photo_status(id);
