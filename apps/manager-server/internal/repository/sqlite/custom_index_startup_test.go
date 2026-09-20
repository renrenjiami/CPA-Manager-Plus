package sqlite

import (
	"path/filepath"
	"testing"
)

func TestStartupDoesNotRebuildCustomMonitoringCover(t *testing.T) {
	path := filepath.Join(t.TempDir(), "usage.sqlite")
	db, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = db.Exec("drop index if exists idx_usage_events_monitoring_cover_v1"); err != nil {
		t.Fatal(err)
	}
	if _, err = db.Exec(`with recursive ids(i) as (select 1 union all select i+1 from ids where i<100000)
 insert into usage_events(event_hash,timestamp_ms,timestamp,model,input_tokens,created_at_ms)
 select 'fixture-'||i,i,'1','fixture-model',1,1 from ids`); err != nil {
		t.Fatal(err)
	}
	if _, err = db.Exec("create index idx_usage_events_monitoring_cover_v2 on usage_events(timestamp_ms,id,requested_model,model,resolved_model)"); err != nil {
		t.Fatal(err)
	}
	if err = db.Close(); err != nil {
		t.Fatal(err)
	}
	db, err = Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	var v1, v2, events int
	if err = db.QueryRow("select count(*) from sqlite_master where name='idx_usage_events_monitoring_cover_v1'").Scan(&v1); err != nil {
		t.Fatal(err)
	}
	if err = db.QueryRow("select count(*) from sqlite_master where name='idx_usage_events_monitoring_cover_v2'").Scan(&v2); err != nil {
		t.Fatal(err)
	}
	if err = db.QueryRow("select count(*) from usage_events").Scan(&events); err != nil {
		t.Fatal(err)
	}
	if v1 != 0 || v2 != 1 || events != 100000 {
		t.Fatalf("v1=%d v2=%d events=%d; want 0/1/100000", v1, v2, events)
	}
}

func TestStartupPreservesExistingCustomMonitoringCover(t *testing.T) {
	path := filepath.Join(t.TempDir(), "usage.sqlite")
	db, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = db.Exec("create index if not exists idx_usage_events_monitoring_cover_v1 on usage_events(timestamp_ms,model)"); err != nil {
		t.Fatal(err)
	}
	var before string
	if err = db.QueryRow("select sql from sqlite_master where name='idx_usage_events_monitoring_cover_v1'").Scan(&before); err != nil {
		t.Fatal(err)
	}
	if err = db.Close(); err != nil {
		t.Fatal(err)
	}
	db, err = Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	var after string
	if err = db.QueryRow("select sql from sqlite_master where name='idx_usage_events_monitoring_cover_v1'").Scan(&after); err != nil {
		t.Fatal(err)
	}
	if before != after {
		t.Fatal("existing index was changed")
	}
}
