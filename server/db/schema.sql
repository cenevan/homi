-- Schema for Homi app

create table if not exists inventory_items (
  id serial primary key,
  item_name text not null,
  owner_name text not null,
  category text not null,
  status text not null default 'available',
  tag text not null default 'free-to-borrow',
  date_added date not null default current_date,
  description text
);

create index if not exists idx_inventory_owner on inventory_items(owner_name);
create index if not exists idx_inventory_category on inventory_items(category);
create index if not exists idx_inventory_tag on inventory_items(tag);

create table if not exists shopping_list_items (
  id serial primary key,
  item_name text not null,
  owner_name text not null,
  category text not null,
  priority text not null default 'medium',
  date_added date not null default current_date,
  status text not null default 'needed',
  notes text
);

create index if not exists idx_shopping_owner on shopping_list_items(owner_name);
create index if not exists idx_shopping_category on shopping_list_items(category);
create index if not exists idx_shopping_priority on shopping_list_items(priority);

-- Receipts for picked-up items and tracking uploads
create table if not exists receipts (
  id serial primary key,
  receipt_name text not null,
  file_name text,
  uploaded_by text not null,
  upload_date date not null default current_date,
  store_name text,
  total_cost text,
  notes text
);

create index if not exists idx_receipts_uploader on receipts(uploaded_by);
create index if not exists idx_receipts_date on receipts(upload_date);

-- Picked-up items for tracking shopping pickups by roommates
create table if not exists picked_up_items (
  id serial primary key,
  item_name text not null,
  original_owner text not null,
  picked_up_by text not null,
  category text not null,
  priority text not null,
  date_picked_up date not null default current_date,
  receipt_id text,
  receipt_image text,
  store_name text,
  cost text,
  notes text,
  paid boolean not null default false,
  date_paid date
);

create index if not exists idx_picked_up_owner on picked_up_items(original_owner);
create index if not exists idx_picked_up_by on picked_up_items(picked_up_by);
create index if not exists idx_picked_up_date on picked_up_items(date_picked_up);
