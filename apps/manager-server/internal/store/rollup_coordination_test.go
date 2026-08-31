package store

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"time"
)

func TestRunRollupCatchUpSerializesSharedGate(t *testing.T) {
	gate := make(chan struct{}, 1)
	firstEntered := make(chan struct{})
	firstRelease := make(chan struct{})
	firstDone := make(chan struct{})
	go func() {
		defer close(firstDone)
		_, _ = runRollupCatchUp(context.Background(), gate, func() (int, error) {
			close(firstEntered)
			<-firstRelease
			return 1, nil
		})
	}()
	<-firstEntered

	secondEntered := make(chan struct{})
	secondDone := make(chan struct{})
	go func() {
		defer close(secondDone)
		_, _ = runRollupCatchUp(context.Background(), gate, func() (int, error) {
			close(secondEntered)
			return 2, nil
		})
	}()

	select {
	case <-secondEntered:
		t.Fatal("second rollup entered while the first rollup still held the shared gate")
	case <-time.After(50 * time.Millisecond):
	}
	close(firstRelease)
	select {
	case <-secondEntered:
	case <-time.After(time.Second):
		t.Fatal("second rollup did not enter after the first released the shared gate")
	}
	<-firstDone
	<-secondDone
}

func TestRunRollupCatchUpRetriesSQLiteBusy(t *testing.T) {
	var attempts atomic.Int32
	result, err := runRollupCatchUp(context.Background(), make(chan struct{}, 1), func() (int, error) {
		if attempts.Add(1) < 3 {
			return 0, errors.New("database is locked (517)")
		}
		return 42, nil
	})
	if err != nil {
		t.Fatalf("run rollup: %v", err)
	}
	if result != 42 || attempts.Load() != 3 {
		t.Fatalf("result/attempts = %d/%d, want 42/3", result, attempts.Load())
	}
}

func TestRunRollupCatchUpDoesNotRetryOtherErrors(t *testing.T) {
	var attempts atomic.Int32
	wantErr := errors.New("broken rollup table")
	_, err := runRollupCatchUp(context.Background(), make(chan struct{}, 1), func() (int, error) {
		attempts.Add(1)
		return 0, wantErr
	})
	if !errors.Is(err, wantErr) || attempts.Load() != 1 {
		t.Fatalf("error/attempts = %v/%d, want %v/1", err, attempts.Load(), wantErr)
	}
}
